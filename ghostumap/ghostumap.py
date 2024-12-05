import time
from warnings import warn
import joblib


from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.metrics import pairwise_distances
from sklearn.neighbors import KDTree
from sklearn.utils import check_array, check_random_state

from umap import UMAP

from umap import distances as dist
from umap import sparse as sparse
from umap.umap_ import (
    find_ab_params,
    noisy_scale_coords,
    make_epochs_per_sample,
    INT32_MIN,
    INT32_MAX,
    reset_local_connectivity,
    raise_disconnected_warning,
    general_simplicial_set_intersection,
    fuzzy_simplicial_set,
    discrete_metric_simplicial_set_intersection,
    nearest_neighbors,
)
from umap.utils import (
    ts,
    csr_unique,
)
from umap.spectral import spectral_layout, tswspectral_layout


import numpy as np
import numba
import scipy.sparse
from scipy.sparse import tril as sparse_tril, triu as sparse_triu


from pynndescent.distances import named_distances as pynn_named_distances
from pynndescent.sparse import sparse_named_distances as pynn_sparse_named_distances

from .utils import get_distance, compute_distances, drop_ghosts

from .layouts import optimize_layout_euclidean

from .configs import get_config as _get_config, set_config
from .results import get_results as _get_results, set_results
from .widget import Widget
from IPython.display import display


def simplicial_set_embedding(
    data,
    n_ghosts,
    graph,
    n_components,
    initial_alpha,
    a,
    b,
    gamma,
    negative_sample_rate,
    n_epochs,
    init,
    random_state,
    metric,
    metric_kwds,
    parallel=False,
    verbose=False,
    tqdm_kwds=None,
):
    """Perform a fuzzy simplicial set embedding, using a specified
    initialisation method and then minimizing the fuzzy set cross entropy
    between the 1-skeletons of the high and low dimensional fuzzy simplicial
    sets.

    Parameters
    ----------
    data: array of shape (n_samples, n_features)
        The source data to be embedded by UMAP.

    graph: sparse matrix
        The 1-skeleton of the high dimensional fuzzy simplicial set as
        represented by a graph for which we require a sparse matrix for the
        (weighted) adjacency matrix.

    n_components: int
        The dimensionality of the euclidean space into which to embed the data.

    initial_alpha: float
        Initial learning rate for the SGD.

    a: float
        Parameter of differentiable approximation of right adjoint functor

    b: float
        Parameter of differentiable approximation of right adjoint functor

    gamma: float
        Weight to apply to negative samples.

    negative_sample_rate: int (optional, default 5)
        The number of negative samples to select per positive sample
        in the optimization process. Increasing this value will result
        in greater repulsive force being applied, greater optimization
        cost, but slightly more accuracy.

    n_epochs: int (optional, default 0), or list of int
        The number of training epochs to be used in optimizing the
        low dimensional embedding. Larger values result in more accurate
        embeddings. If 0 is specified a value will be selected based on
        the size of the input dataset (200 for large datasets, 500 for small).
        If a list of int is specified, then the intermediate embeddings at the
        different epochs specified in that list are returned in
        ``aux_data["embedding_list"]``.

    init: string
        How to initialize the low dimensional embedding. Options are:

            * 'spectral': use a spectral embedding of the fuzzy 1-skeleton
            * 'random': assign initial embedding positions at random.
            * 'pca': use the first n_components from PCA applied to the input data.
            * A numpy array of initial embedding positions.

    random_state: numpy RandomState or equivalent
        A state capable being used as a numpy random state.

    metric: string or callable
        The metric used to measure distance in high dimensional space; used if
        multiple connected components need to be layed out.

    metric_kwds: dict
        Key word arguments to be passed to the metric function; used if
        multiple connected components need to be layed out.

    densmap: bool
        Whether to use the density-augmented objective function to optimize
        the embedding according to the densMAP algorithm.

    densmap_kwds: dict
        Key word arguments to be used by the densMAP optimization.

    output_dens: bool
        Whether to output local radii in the original data and the embedding.

    output_metric: function
        Function returning the distance between two points in embedding space and
        the gradient of the distance wrt the first argument.

    output_metric_kwds: dict
        Key word arguments to be passed to the output_metric function.

    euclidean_output: bool
        Whether to use the faster code specialised for euclidean output metrics

    parallel: bool (optional, default False)
        Whether to run the computation using numba parallel.
        Running in parallel is non-deterministic, and is not used
        if a random seed has been set, to ensure reproducibility.

    verbose: bool (optional, default False)
        Whether to report information on the current progress of the algorithm.

    tqdm_kwds: dict
        Key word arguments to be used by the tqdm progress bar.

    Returns
    -------
    embedding: array of shape (n_samples, n_components)
        The optimized of ``graph`` into an ``n_components`` dimensional
        euclidean space.

    aux_data: dict
        Auxiliary output returned with the embedding. When densMAP extension
        is turned on, this dictionary includes local radii in the original
        data (``rad_orig``) and in the embedding (``rad_emb``).
    """
    graph = graph.tocoo()
    graph.sum_duplicates()
    n_vertices = graph.shape[1]

    # For smaller datasets we can use more epochs
    if graph.shape[0] <= 10000:
        default_epochs = 500
    else:
        default_epochs = 200

    if n_epochs is None:
        n_epochs = default_epochs

    # If n_epoch is a list, get the maximum epoch to reach
    n_epochs_max = max(n_epochs) if isinstance(n_epochs, list) else n_epochs

    if n_epochs_max > 10:
        graph.data[graph.data < (graph.data.max() / float(n_epochs_max))] = 0.0
    else:
        graph.data[graph.data < (graph.data.max() / float(default_epochs))] = 0.0

    graph.eliminate_zeros()

    if isinstance(init, str) and init == "random":
        embedding = random_state.uniform(
            low=-10.0, high=10.0, size=(graph.shape[0], n_components)
        ).astype(np.float32)
    elif isinstance(init, str) and init == "pca":
        if scipy.sparse.issparse(data):
            pca = TruncatedSVD(n_components=n_components, random_state=random_state)
        else:
            pca = PCA(n_components=n_components, random_state=random_state)
        embedding = pca.fit_transform(data).astype(np.float32)
        embedding = noisy_scale_coords(
            embedding, random_state, max_coord=10, noise=0.0001
        )
    elif isinstance(init, str) and init == "spectral":
        embedding = spectral_layout(
            data,
            graph,
            n_components,
            random_state,
            metric=metric,
            metric_kwds=metric_kwds,
        )
        # We add a little noise to avoid local minima for optimization to come
        embedding = noisy_scale_coords(
            embedding, random_state, max_coord=10, noise=0.0001
        )

    elif isinstance(init, str) and init == "tswspectral":
        embedding = tswspectral_layout(
            data,
            graph,
            n_components,
            random_state,
            metric=metric,
            metric_kwds=metric_kwds,
        )
        embedding = noisy_scale_coords(
            embedding, random_state, max_coord=10, noise=0.0001
        )
    else:
        init_data = np.array(init)
        if len(init_data.shape) == 2:
            if np.unique(init_data, axis=0).shape[0] < init_data.shape[0]:
                tree = KDTree(init_data)
                dist, ind = tree.query(init_data, k=2)
                nndist = np.mean(dist[:, 1])
                embedding = init_data + random_state.normal(
                    scale=0.001 * nndist, size=init_data.shape
                ).astype(np.float32)
            else:
                embedding = init_data

    epochs_per_sample = make_epochs_per_sample(graph.data, n_epochs_max)

    head = graph.row
    tail = graph.col
    weight = graph.data

    rng_state = random_state.randint(INT32_MIN, INT32_MAX, 3).astype(np.int64)

    aux_data = {}

    embedding = (
        10.0
        * (embedding - np.min(embedding, 0))
        / (np.max(embedding, 0) - np.min(embedding, 0))
    ).astype(np.float32, order="C")

    (original_embedding, ghost_embeddings, ghost_mask) = optimize_layout_euclidean(
        n_ghosts,
        embedding,
        head,
        tail,
        n_epochs,
        n_vertices,
        epochs_per_sample,
        a,
        b,
        rng_state,
        gamma,
        initial_alpha,
        negative_sample_rate,
        parallel=parallel,
        verbose=verbose,
        tqdm_kwds=tqdm_kwds,
        move_other=True,
    )

    return original_embedding, ghost_embeddings, ghost_mask, aux_data


class GhostUMAP2(UMAP):
    """GhostUMAP

    GhostUMAP is a variant of UMAP that allows for the embedding of
    additional "ghost" points into the embedding space. These ghost
    points are used to represent the uncertainty in the embedding
    of the original data points.

    Parameters
    ----------
    n_neighbors: float (optional, default 15)
        The size of local neighborhood (in terms of number of neighboring
        sample points) used for manifold approximation. Larger values
        result in more global views of the manifold, while smaller
        values result in more local data being preserved. In general
        values should be in the range 2 to 100.

    n_components: int (optional, default 2)
        The dimension of the space to embed into. This defaults to 2 to
        provide easy visualization, but can reasonably be set to any
        integer value in the range 2 to 100.

    metric: string or function (optional, default 'euclidean')
        The metric to use to compute distances in high dimensional space.
        If a string is passed it must match a valid predefined metric. If
        a general metric is required a function that takes two 1d arrays and
        returns a float can be provided. For performance purposes it is
        required that this be a numba jit'd function. Valid string metrics
        include:

        * euclidean
        * manhattan
        * chebyshev
        * minkowski
        * canberra
        * braycurtis
        * mahalanobis
        * wminkowski
        * seuclidean
        * cosine
        * correlation
        * haversine
        * hamming
        * jaccard
        * dice
        * russelrao
        * kulsinski
        * ll_dirichlet
        * hellinger
        * rogerstanimoto
        * sokalmichener
        * sokalsneath
        * yule

        Metrics that take arguments (such as minkowski, mahalanobis etc.)
        can have arguments passed via the metric_kwds dictionary. At this
        time care must be taken and dictionary elements must be ordered
        appropriately; this will hopefully be fixed in the future.

    n_epochs: int (optional, default None)
        The number of training epochs to be used in optimizing the
        low dimensional embedding. Larger values result in more accurate
        embeddings. If None is specified a value will be selected based on
        the size of the input dataset (200 for large datasets, 500 for small).

    learning_rate: float (optional, default 1.0)
        The initial learning rate for the embedding optimization.

    init: string (optional, default 'spectral')
        How to initialize the low dimensional embedding. Options are:

            * 'spectral': use a spectral embedding of the fuzzy 1-skeleton
            * 'random': assign initial embedding positions at random.
            * 'pca': use the first n_components from PCA applied to the
                input data.
            * 'tswspectral': use a spectral embedding of the fuzzy
                1-skeleton, using a truncated singular value decomposition to
                "warm" up the eigensolver. This is intended as an alternative
                to the 'spectral' method, if that takes an  excessively long
                time to complete initialization (or fails to complete).
            * A numpy array of initial embedding positions.

    min_dist: float (optional, default 0.1)
        The effective minimum distance between embedded points. Smaller values
        will result in a more clustered/clumped embedding where nearby points
        on the manifold are drawn closer together, while larger values will
        result on a more even dispersal of points. The value should be set
        relative to the ``spread`` value, which determines the scale at which
        embedded points will be spread out.

    spread: float (optional, default 1.0)
        The effective scale of embedded points. In combination with ``min_dist``
        this determines how clustered/clumped the embedded points are.

    low_memory: bool (optional, default True)
        For some datasets the nearest neighbor computation can consume a lot of
        memory. If you find that UMAP is failing due to memory constraints
        consider setting this option to True. This approach is more
        computationally expensive, but avoids excessive memory use.

    set_op_mix_ratio: float (optional, default 1.0)
        Interpolate between (fuzzy) union and intersection as the set operation
        used to combine local fuzzy simplicial sets to obtain a global fuzzy
        simplicial sets. Both fuzzy set operations use the product t-norm.
        The value of this parameter should be between 0.0 and 1.0; a value of
        1.0 will use a pure fuzzy union, while 0.0 will use a pure fuzzy
        intersection.

    local_connectivity: int (optional, default 1)
        The local connectivity required -- i.e. the number of nearest
        neighbors that should be assumed to be connected at a local level.
        The higher this value the more connected the manifold becomes
        locally. In practice this should be not more than the local intrinsic
        dimension of the manifold.

    repulsion_strength: float (optional, default 1.0)
        Weighting applied to negative samples in low dimensional embedding
        optimization. Values higher than one will result in greater weight
        being given to negative samples.

    negative_sample_rate: int (optional, default 5)
        The number of negative samples to select per positive sample
        in the optimization process. Increasing this value will result
        in greater repulsive force being applied, greater optimization
        cost, but slightly more accuracy.

    transform_queue_size: float (optional, default 4.0)
        For transform operations (embedding new points using a trained model
        this will control how aggressively to search for nearest neighbors.
        Larger values will result in slower performance but more accurate
        nearest neighbor evaluation.

    a: float (optional, default None)
        More specific parameters controlling the embedding. If None these
        values are set automatically as determined by ``min_dist`` and
        ``spread``.
    b: float (optional, default None)
        More specific parameters controlling the embedding. If None these
        values are set automatically as determined by ``min_dist`` and
        ``spread``.

    random_state: int, RandomState instance or None, optional (default: None)
        If int, random_state is the seed used by the random number generator;
        If RandomState instance, random_state is the random number generator;
        If None, the random number generator is the RandomState instance used
        by `np.random`.

    metric_kwds: dict (optional, default None)
        Arguments to pass on to the metric, such as the ``p`` value for
        Minkowski distance. If None then no arguments are passed on.

    angular_rp_forest: bool (optional, default False)
        Whether to use an angular random projection forest to initialise
        the approximate nearest neighbor search. This can be faster, but is
        mostly only useful for a metric that uses an angular style distance such
        as cosine, correlation etc. In the case of those metrics angular forests
        will be chosen automatically.

    target_n_neighbors: int (optional, default -1)
        The number of nearest neighbors to use to construct the target simplicial
        set. If set to -1 use the ``n_neighbors`` value.

    target_metric: string or callable (optional, default 'categorical')
        The metric used to measure distance for a target array is using supervised
        dimension reduction. By default this is 'categorical' which will measure
        distance in terms of whether categories match or are different. Furthermore,
        if semi-supervised is required target values of -1 will be trated as
        unlabelled under the 'categorical' metric. If the target array takes
        continuous values (e.g. for a regression problem) then metric of 'l1'
        or 'l2' is probably more appropriate.

    target_metric_kwds: dict (optional, default None)
        Keyword argument to pass to the target metric when performing
        supervised dimension reduction. If None then no arguments are passed on.

    target_weight: float (optional, default 0.5)
        weighting factor between data topology and target topology. A value of
        0.0 weights predominantly on data, a value of 1.0 places a strong emphasis on
        target. The default of 0.5 balances the weighting equally between data and
        target.

    transform_seed: int (optional, default 42)
        Random seed used for the stochastic aspects of the transform operation.
        This ensures consistency in transform operations.

    verbose: bool (optional, default False)
        Controls verbosity of logging.

    tqdm_kwds: dict (optional, defaul None)
        Key word arguments to be used by the tqdm progress bar.

    unique: bool (optional, default False)
        Controls if the rows of your data should be uniqued before being
        embedded.  If you have more duplicates than you have ``n_neighbors``
        you can have the identical data points lying in different regions of
        your space.  It also violates the definition of a metric.
        For to map from internal structures back to your data use the variable
        _unique_inverse_.

    densmap: bool (optional, default False)
        Specifies whether the density-augmented objective of densMAP
        should be used for optimization. Turning on this option generates
        an embedding where the local densities are encouraged to be correlated
        with those in the original space. Parameters below with the prefix 'dens'
        further control the behavior of this extension.

    dens_lambda: float (optional, default 2.0)
        Controls the regularization weight of the density correlation term
        in densMAP. Higher values prioritize density preservation over the
        UMAP objective, and vice versa for values closer to zero. Setting this
        parameter to zero is equivalent to running the original UMAP algorithm.

    dens_frac: float (optional, default 0.3)
        Controls the fraction of epochs (between 0 and 1) where the
        density-augmented objective is used in densMAP. The first
        (1 - dens_frac) fraction of epochs optimize the original UMAP objective
        before introducing the density correlation term.

    dens_var_shift: float (optional, default 0.1)
        A small constant added to the variance of local radii in the
        embedding when calculating the density correlation objective to
        prevent numerical instability from dividing by a small number

    output_dens: float (optional, default False)
        Determines whether the local radii of the final embedding (an inverse
        measure of local density) are computed and returned in addition to
        the embedding. If set to True, local radii of the original data
        are also included in the output for comparison; the output is a tuple
        (embedding, original local radii, embedding local radii). This option
        can also be used when densmap=False to calculate the densities for
        UMAP embeddings.

    disconnection_distance: float (optional, default np.inf or maximal value for bounded distances)
        Disconnect any vertices of distance greater than or equal to disconnection_distance when approximating the
        manifold via our k-nn graph. This is particularly useful in the case that you have a bounded metric.  The
        UMAP assumption that we have a connected manifold can be problematic when you have points that are maximally
        different from all the rest of your data.  The connected manifold assumption will make such points have perfect
        similarity to a random set of other points.  Too many such points will artificially connect your space.

    precomputed_knn: tuple (optional, default (None,None,None))
        If the k-nearest neighbors of each point has already been calculated you
        can pass them in here to save computation time. The number of nearest
        neighbors in the precomputed_knn must be greater or equal to the
        n_neighbors parameter. This should be a tuple containing the output
        of the nearest_neighbors() function or attributes from a previously fit
        UMAP object; (knn_indices, knn_dists, knn_search_index). If you wish to use
        k-nearest neighbors data calculated by another package then provide a tuple of
        the form (knn_indices, knn_dists). The contents of the tuple should be two numpy
        arrays of shape (N, n_neighbors) where N is the number of items in the
        input data. The first array should be the integer indices of the nearest
        neighbors, and the second array should be the corresponding distances. The
        nearest neighbor of each item should be itself, e.g. the nearest neighbor of
        item 0 should be 0, the nearest neighbor of item 1 is 1 and so on. Please note
        that you will *not* be able to transform new data in this case.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _fit_embed_data(self, X, n_ghosts, n_epochs, init, random_state):
        """A method wrapper for simplicial_set_embedding_with_ghost that can be
        replaced by subclasses.
        """
        return simplicial_set_embedding(
            X,
            n_ghosts,
            self.graph_,
            self.n_components,
            self._initial_alpha,
            self._a,
            self._b,
            self.repulsion_strength,
            self.negative_sample_rate,
            n_epochs,
            init,
            random_state,
            self._input_distance_func,
            self._metric_kwds,
            self.random_state is None,
            self.verbose,
            tqdm_kwds=self.tqdm_kwds,
        )

    def fit(
        self,
        X,
        y=None,
        force_all_finite=True,
        n_ghosts=16,
    ):
        """Fit X into an embedded space.

        Optionally use y for supervised dimension reduction.

        Parameters
        ----------
        X : array, shape (n_samples, n_features) or (n_samples, n_samples)
            If the metric is 'precomputed' X must be a square distance
            matrix. Otherwise it contains a sample per row. If the method
            is 'exact', X may be a sparse matrix of type 'csr', 'csc'
            or 'coo'.

        y : array, shape (n_samples)
            A target array for supervised dimension reduction. How this is
            handled is determined by parameters UMAP was instantiated with.
            The relevant attributes are ``target_metric`` and
            ``target_metric_kwds``.

        force_all_finite : Whether to raise an error on np.inf, np.nan, pd.NA in array.
            The possibilities are: - True: Force all values of array to be finite.
                                   - False: accepts np.inf, np.nan, pd.NA in array.
                                   - 'allow-nan': accepts only np.nan and pd.NA values in array.
                                     Values cannot be infinite.
        """

        X = check_array(
            X,
            dtype=np.float32,
            accept_sparse="csr",
            order="C",
            force_all_finite=force_all_finite,
        )
        self._raw_data = X

        # Handle all the optional arguments, setting default
        if self.a is None or self.b is None:
            self._a, self._b = find_ab_params(self.spread, self.min_dist)
        else:
            self._a = self.a
            self._b = self.b

        if isinstance(self.init, np.ndarray):
            init = check_array(
                self.init,
                dtype=np.float32,
                accept_sparse=False,
                force_all_finite=force_all_finite,
            )
        else:
            init = self.init

        self._initial_alpha = self.learning_rate

        self.knn_indices = self.precomputed_knn[0]
        self.knn_dists = self.precomputed_knn[1]
        # #848: allow precomputed knn to not have a search index
        if len(self.precomputed_knn) == 2:
            self.knn_search_index = None
        else:
            self.knn_search_index = self.precomputed_knn[2]

        self._validate_parameters()

        if self.verbose:
            print(str(self))

        self._original_n_threads = numba.get_num_threads()
        if self.n_jobs > 0 and self.n_jobs is not None:
            numba.set_num_threads(self.n_jobs)

        # Check if we should unique the data
        # We've already ensured that we aren't in the precomputed case
        if self.unique:
            # check if the matrix is dense
            if self._sparse_data:
                # Call a sparse unique function
                index, inverse, counts = csr_unique(X)
            else:
                index, inverse, counts = np.unique(
                    X,
                    return_index=True,
                    return_inverse=True,
                    return_counts=True,
                    axis=0,
                )[1:4]
            if self.verbose:
                print(
                    "Unique=True -> Number of data points reduced from ",
                    X.shape[0],
                    " to ",
                    X[index].shape[0],
                )
                most_common = np.argmax(counts)
                print(
                    "Most common duplicate is",
                    index[most_common],
                    " with a count of ",
                    counts[most_common],
                )
            # We'll expose an inverse map when unique=True for users to map from our internal structures to their data
            self._unique_inverse_ = inverse
        # If we aren't asking for unique use the full index.
        # This will save special cases later.
        else:
            index = list(range(X.shape[0]))
            inverse = list(range(X.shape[0]))

        # Error check n_neighbors based on data size
        if X[index].shape[0] <= self.n_neighbors:
            if X[index].shape[0] == 1:
                self.embedding_ = np.zeros(
                    (1, self.n_components)
                )  # needed to sklearn comparability
                return self

            warn(
                "n_neighbors is larger than the dataset size; truncating to "
                "X.shape[0] - 1"
            )
            self._n_neighbors = X[index].shape[0] - 1
            if self.densmap:
                self._densmap_kwds["n_neighbors"] = self._n_neighbors
        else:
            self._n_neighbors = self.n_neighbors

        # Note: unless it causes issues for setting 'index', could move this to
        # initial sparsity check above
        if self._sparse_data and not X.has_sorted_indices:
            X.sort_indices()

        random_state = check_random_state(self.random_state)

        if self.verbose:
            print(ts(), "Construct fuzzy simplicial set")

        if self.metric == "precomputed" and self._sparse_data:
            # For sparse precomputed distance matrices, we just argsort the rows to find
            # nearest neighbors. To make this easier, we expect matrices that are
            # symmetrical (so we can find neighbors by looking at rows in isolation,
            # rather than also having to consider that sample's column too).
            # print("Computing KNNs for sparse precomputed distances...")
            if sparse_tril(X).getnnz() != sparse_triu(X).getnnz():
                raise ValueError(
                    "Sparse precomputed distance matrices should be symmetrical!"
                )
            if not np.all(X.diagonal() == 0):
                raise ValueError("Non-zero distances from samples to themselves!")
            if self.knn_dists is None:
                self._knn_indices = np.zeros((X.shape[0], self.n_neighbors), dtype=int)
                self._knn_dists = np.zeros(self._knn_indices.shape, dtype=float)
                for row_id in range(X.shape[0]):
                    # Find KNNs row-by-row
                    row_data = X[row_id].data
                    row_indices = X[row_id].indices
                    if len(row_data) < self._n_neighbors:
                        raise ValueError(
                            "Some rows contain fewer than n_neighbors distances!"
                        )
                    row_nn_data_indices = np.argsort(row_data)[: self._n_neighbors]
                    self._knn_indices[row_id] = row_indices[row_nn_data_indices]
                    self._knn_dists[row_id] = row_data[row_nn_data_indices]
            else:
                self._knn_indices = self.knn_indices
                self._knn_dists = self.knn_dists
            # Disconnect any vertices farther apart than _disconnection_distance
            disconnected_index = self._knn_dists >= self._disconnection_distance
            self._knn_indices[disconnected_index] = -1
            self._knn_dists[disconnected_index] = np.inf
            edges_removed = disconnected_index.sum()

            (
                self.graph_,
                self._sigmas,
                self._rhos,
                self.graph_dists_,
            ) = fuzzy_simplicial_set(
                X[index],
                self.n_neighbors,
                random_state,
                "precomputed",
                self._metric_kwds,
                self._knn_indices,
                self._knn_dists,
                self.angular_rp_forest,
                self.set_op_mix_ratio,
                self.local_connectivity,
                True,
                self.verbose,
                self.densmap or self.output_dens,
            )
            # Report the number of vertices with degree 0 in our our umap.graph_
            # This ensures that they were properly disconnected.
            vertices_disconnected = np.sum(
                np.array(self.graph_.sum(axis=1)).flatten() == 0
            )
            raise_disconnected_warning(
                edges_removed,
                vertices_disconnected,
                self._disconnection_distance,
                self._raw_data.shape[0],
                verbose=self.verbose,
            )
        # Handle small cases efficiently by computing all distances
        elif X[index].shape[0] < 4096 and not self.force_approximation_algorithm:
            self._small_data = True
            try:
                # sklearn pairwise_distances fails for callable metric on sparse data
                _m = self.metric if self._sparse_data else self._input_distance_func
                dmat = pairwise_distances(X[index], metric=_m, **self._metric_kwds)
            except (ValueError, TypeError) as e:
                # metric is numba.jit'd or not supported by sklearn,
                # fallback to pairwise special

                if self._sparse_data:
                    # Get a fresh metric since we are casting to dense
                    if not callable(self.metric):
                        _m = dist.named_distances[self.metric]
                        dmat = dist.pairwise_special_metric(
                            X[index].toarray(),
                            metric=_m,
                            kwds=self._metric_kwds,
                            force_all_finite=force_all_finite,
                        )
                    else:
                        dmat = dist.pairwise_special_metric(
                            X[index],
                            metric=self._input_distance_func,
                            kwds=self._metric_kwds,
                            force_all_finite=force_all_finite,
                        )
                else:
                    dmat = dist.pairwise_special_metric(
                        X[index],
                        metric=self._input_distance_func,
                        kwds=self._metric_kwds,
                        force_all_finite=force_all_finite,
                    )
            # set any values greater than disconnection_distance to be np.inf.
            # This will have no effect when _disconnection_distance is not set since it defaults to np.inf.
            edges_removed = np.sum(dmat >= self._disconnection_distance)
            dmat[dmat >= self._disconnection_distance] = np.inf
            (
                self.graph_,
                self._sigmas,
                self._rhos,
                self.graph_dists_,
            ) = fuzzy_simplicial_set(
                dmat,
                self._n_neighbors,
                random_state,
                "precomputed",
                self._metric_kwds,
                None,
                None,
                self.angular_rp_forest,
                self.set_op_mix_ratio,
                self.local_connectivity,
                True,
                self.verbose,
                self.densmap or self.output_dens,
            )
            # Report the number of vertices with degree 0 in our umap.graph_
            # This ensures that they were properly disconnected.
            vertices_disconnected = np.sum(
                np.array(self.graph_.sum(axis=1)).flatten() == 0
            )
            raise_disconnected_warning(
                edges_removed,
                vertices_disconnected,
                self._disconnection_distance,
                self._raw_data.shape[0],
                verbose=self.verbose,
            )
        else:
            # Standard case
            self._small_data = False
            # Standard case
            if self._sparse_data and self.metric in pynn_sparse_named_distances:
                nn_metric = self.metric
            elif not self._sparse_data and self.metric in pynn_named_distances:
                nn_metric = self.metric
            else:
                nn_metric = self._input_distance_func
            if self.knn_dists is None:
                (
                    self._knn_indices,
                    self._knn_dists,
                    self._knn_search_index,
                ) = nearest_neighbors(
                    X[index],
                    self._n_neighbors,
                    nn_metric,
                    self._metric_kwds,
                    self.angular_rp_forest,
                    random_state,
                    self.low_memory,
                    use_pynndescent=True,
                    n_jobs=self.n_jobs,
                    verbose=self.verbose,
                )
                self.knn_indices = self._knn_indices
                self.knn_dists = self._knn_dists
                self.knn_search_index = self._knn_search_index
            else:
                self._knn_indices = self.knn_indices
                self._knn_dists = self.knn_dists
                self._knn_search_index = self.knn_search_index
            # Disconnect any vertices farther apart than _disconnection_distance
            disconnected_index = self._knn_dists >= self._disconnection_distance
            self._knn_indices[disconnected_index] = -1
            self._knn_dists[disconnected_index] = np.inf
            edges_removed = disconnected_index.sum()

            (
                self.graph_,
                self._sigmas,
                self._rhos,
                self.graph_dists_,
            ) = fuzzy_simplicial_set(
                X[index],
                self.n_neighbors,
                random_state,
                nn_metric,
                self._metric_kwds,
                self._knn_indices,
                self._knn_dists,
                self.angular_rp_forest,
                self.set_op_mix_ratio,
                self.local_connectivity,
                True,
                self.verbose,
                self.densmap or self.output_dens,
            )
            # Report the number of vertices with degree 0 in our umap.graph_
            # This ensures that they were properly disconnected.
            vertices_disconnected = np.sum(
                np.array(self.graph_.sum(axis=1)).flatten() == 0
            )
            raise_disconnected_warning(
                edges_removed,
                vertices_disconnected,
                self._disconnection_distance,
                self._raw_data.shape[0],
                verbose=self.verbose,
            )

        # Currently not checking if any duplicate points have differing labels
        # Might be worth throwing a warning...
        if y is not None:
            len_X = len(X) if not self._sparse_data else X.shape[0]
            if len_X != len(y):
                raise ValueError(
                    "Length of x = {len_x}, length of y = {len_y}, while it must be equal.".format(
                        len_x=len_X, len_y=len(y)
                    )
                )
            if self.target_metric == "string":
                y_ = y[index]
            else:
                y_ = check_array(y, ensure_2d=False, force_all_finite=force_all_finite)[
                    index
                ]
            if self.target_metric == "categorical":
                if self.target_weight < 1.0:
                    far_dist = 2.5 * (1.0 / (1.0 - self.target_weight))
                else:
                    far_dist = 1.0e12
                self.graph_ = discrete_metric_simplicial_set_intersection(
                    self.graph_, y_, far_dist=far_dist
                )
            elif self.target_metric in dist.DISCRETE_METRICS:
                if self.target_weight < 1.0:
                    scale = 2.5 * (1.0 / (1.0 - self.target_weight))
                else:
                    scale = 1.0e12
                # self.graph_ = discrete_metric_simplicial_set_intersection(
                #     self.graph_,
                #     y_,
                #     metric=self.target_metric,
                #     metric_kws=self.target_metric_kwds,
                #     metric_scale=scale
                # )

                metric_kws = dist.get_discrete_params(y_, self.target_metric)

                self.graph_ = discrete_metric_simplicial_set_intersection(
                    self.graph_,
                    y_,
                    metric=self.target_metric,
                    metric_kws=metric_kws,
                    metric_scale=scale,
                )
            else:
                if len(y_.shape) == 1:
                    y_ = y_.reshape(-1, 1)
                if self.target_n_neighbors == -1:
                    target_n_neighbors = self._n_neighbors
                else:
                    target_n_neighbors = self.target_n_neighbors

                # Handle the small case as precomputed as before
                if y.shape[0] < 4096:
                    try:
                        ydmat = pairwise_distances(
                            y_, metric=self.target_metric, **self._target_metric_kwds
                        )
                    except (TypeError, ValueError):
                        ydmat = dist.pairwise_special_metric(
                            y_,
                            metric=self.target_metric,
                            kwds=self._target_metric_kwds,
                            force_all_finite=force_all_finite,
                        )

                    (
                        target_graph,
                        target_sigmas,
                        target_rhos,
                    ) = fuzzy_simplicial_set(
                        ydmat,
                        target_n_neighbors,
                        random_state,
                        "precomputed",
                        self._target_metric_kwds,
                        None,
                        None,
                        False,
                        1.0,
                        1.0,
                        False,
                    )
                else:
                    # Standard case
                    (
                        target_graph,
                        target_sigmas,
                        target_rhos,
                    ) = fuzzy_simplicial_set(
                        y_,
                        target_n_neighbors,
                        random_state,
                        self.target_metric,
                        self._target_metric_kwds,
                        None,
                        None,
                        False,
                        1.0,
                        1.0,
                        False,
                    )
                # product = self.graph_.multiply(target_graph)
                # # self.graph_ = 0.99 * product + 0.01 * (self.graph_ +
                # #                                        target_graph -
                # #                                        product)
                # self.graph_ = product
                self.graph_ = general_simplicial_set_intersection(
                    self.graph_, target_graph, self.target_weight
                )
                self.graph_ = reset_local_connectivity(self.graph_)
            self._supervised = True
        else:
            self._supervised = False

        if self.densmap or self.output_dens:
            self._densmap_kwds["graph_dists"] = self.graph_dists_

        if self.verbose:
            print(ts(), "Construct embedding")

        if self.transform_mode == "embedding":
            epochs = (
                self.n_epochs_list if self.n_epochs_list is not None else self.n_epochs
            )
            (
                self.original_embedding,
                self.ghost_embeddings,
                self.ghost_mask,
                aux_data,
            ) = self._fit_embed_data(
                self._raw_data[index],
                n_ghosts,
                epochs,
                init,
                random_state,
            )
            if self.n_epochs_list is not None:
                if "embedding_list" not in aux_data:
                    raise KeyError(
                        "No list of embedding were found in 'aux_data'. "
                        "It is likely the layout optimization function "
                        "doesn't support the list of int for 'n_epochs'."
                    )
                else:
                    self.embedding_list_ = [
                        e[inverse] for e in aux_data["embedding_list"]
                    ]

            # Assign any points that are fully disconnected from our manifold(s) to have embedding
            # coordinates of np.nan.  These will be filtered by our plotting functions automatically.
            # They also prevent users from being deceived a distance query to one of these points.
            # Might be worth moving this into simplicial_set_embedding or _fit_embed_data
            disconnected_vertices = np.array(self.graph_.sum(axis=1)).flatten() == 0
            # if len(disconnected_vertices) > 0:
            #     self.embedding_[disconnected_vertices] = np.full(
            #         self.n_components, np.nan
            #     )

            # self.embedding_ = self.embedding_[inverse]
            # if self.output_dens:
            #     self.rad_orig_ = aux_data["rad_orig"][inverse]
            #     self.rad_emb_ = aux_data["rad_emb"][inverse]

        if self.verbose:
            print(ts() + " Finished embedding")

        numba.set_num_threads(self._original_n_threads)
        self._input_hash = joblib.hash(self._raw_data)

        return self

    def fit_transform(
        self,
        X: np.ndarray,
        force_all_finite: bool = True,
        n_ghosts: int = 8,
        r: float = 0.1,
        sensitivity: float = 1,
        ghost_gen: float = 0.2,
        dropping: bool = True,
        init_dropping: float = 0.4,
        bm_type: str = "None",
    ):
        """
        Fit X into an embedded space with ghosts and return that transformed outputs.

        Parameters
        ----------
        X : array, shape (n_samples, n_features) or (n_samples, n_samples)
            If the metric is 'precomputed' X must be a square distance
            matrix. Otherwise it contains a sample per row. If the method
            is 'exact', X may be a sparse matrix of type 'csr', 'csc'
            or 'coo'.

        force_all_finite : Whether to raise an error on np.inf, np.nan, pd.NA in array.
            The possibilities are: - True: Force all values of array to be finite.
                                    - False: accepts np.inf, np.nan, pd.NA in array.
                                    - 'allow-nan': accepts only np.nan and pd.NA values in array.
                                       Values cannot be infinite.

        n_ghosts : int (optional, default 8)
            The number of ghost points to embed in the embedding space.

        schedule : list of int (optional, default None)
            The schedule of epochs to successive halving.

        Returns
        -------
        embedding : array, shape (n_samples, n_components)
            The transformed samples in the embedded space.

        ghost_embedding : array, shape (n_samples, n_ghosts, n_components)
            The transformed ghost points in the embedded space.

        ghost_indices : array, shape (n_remaining_ghosts,)
            The indices of the ghost points in the original data.

        """
        set_config(
            r=r,
            sensitivity=sensitivity,
            ghost_gen=ghost_gen,
            dropping=dropping,
            init_dropping=init_dropping,
            smoothing_factor=0.9,
            bm_type=bm_type,
        )

        if n_ghosts < 1:
            raise ValueError("n_ghosts should be greater than 0")
        self.radius = r
        y = None
        self.fit(X, y, force_all_finite, n_ghosts)

        return (self.original_embedding, self.ghost_embeddings, self.ghost_mask)

    def get_radii(self) -> np.ndarray:
        if not hasattr(self, "original_embedding"):
            raise ValueError("The model has not been fitted yet.")

        return compute_distances(self.original_embedding, self.ghost_embeddings)

    def get_unstable_ghosts(
        self, distance: float = 0.1, sensitivity: float = 1
    ) -> np.ndarray:
        if not hasattr(self, "original_embedding"):
            raise ValueError("The model has not been fitted yet.")

        ghost_mask = np.ones(self.original_embedding.shape[0], dtype=bool)

        ghost_mask = drop_ghosts(
            self.original_embedding,
            self.ghost_embeddings,
            ghost_mask,
            distance=distance,
            sensitivity=sensitivity,
        )

        return ghost_mask

    def get_distances(self, sensitivity: float = 1) -> np.ndarray:
        return get_distance(
            self.original_embedding,
            self.ghost_embeddings,
            self.ghost_mask,
            sensitivity,
        )

    def get_results(self):
        return _get_results()

    def get_config(self):
        return _get_config()

    def visualize(self, label=None, legend=None):
        """Creates and returns an interactive visualization widget.

        The widget will be automatically displayed in Jupyter environments.
        """

        init_radii = _get_results().init_radii
        widget = Widget(
            original_embedding=self.original_embedding,
            ghost_embedding=self.ghost_embeddings,
            r=self.radius,
            init_radii=init_radii,
            neighbors=(
                self._knn_indices
                if hasattr(self, "_knn_indices")
                else self.get_NN_for_small_data()
            ),
            label=label,
            legend=legend,
        )
        return widget

    def get_NN_for_small_data(self):
        from sklearn.neighbors import NearestNeighbors

        nn = NearestNeighbors(n_neighbors=self._n_neighbors, metric=self.metric)

        nn.fit(self._raw_data)

        _, indices = nn.kneighbors(self._raw_data)

        return indices
