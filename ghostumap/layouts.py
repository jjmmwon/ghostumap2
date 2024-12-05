from dataclasses import asdict
import numpy as np
import numba

from umap.utils import tau_rand_int
from tqdm.auto import tqdm

from .time_checker import measure_time

from .utils import (
    _get_max_extent,
    compute_distances,
    drop_ghosts,
    get_distance,
    sample_ghosts,
)

from .configs import get_config
from .results import set_results


@numba.njit()
def clip(val):
    """Standard clamping of a value into a fixed range (in this case -4.0 to
    4.0)

    Parameters
    ----------
    val: float
        The value to be clamped.

    Returns
    -------
    The clamped value, now fixed to be in the range -4.0 to 4.0.
    """
    if val > 4.0:
        return 4.0
    elif val < -4.0:
        return -4.0
    else:
        return val


@numba.njit(
    "f4(f4[::1],f4[::1])",
    fastmath=True,
    cache=True,
    locals={
        "result": numba.types.float32,
        "diff": numba.types.float32,
        "dim": numba.types.intp,
        "i": numba.types.intp,
    },
)
def rdist(x, y):
    """Reduced Euclidean distance.

    Parameters
    ----------
    x: array of shape (embedding_dim,)
    y: array of shape (embedding_dim,)

    Returns
    -------
    The squared euclidean distance between x and y
    """
    result = 0.0
    dim = x.shape[0]
    for i in range(dim):
        diff = x[i] - y[i]
        result += diff * diff

    return result


def _optimize_real_layout_euclidean_single_epoch(
    head_embedding,
    tail_embedding,
    head,
    tail,
    n_vertices,
    epochs_per_sample,
    a,
    b,
    rng_state,
    gamma,
    dim,
    move_other,
    alpha,
    epochs_per_negative_sample,
    epoch_of_next_negative_sample,
    epoch_of_next_sample,
    n,
):
    for i in numba.prange(epochs_per_sample.shape[0]):
        if epoch_of_next_sample[i] <= n:
            j = head[i]
            k = tail[i]

            current = head_embedding[j]
            other = tail_embedding[k]

            dist_squared = rdist(current, other)

            if dist_squared > 0.0:
                grad_coeff = -2.0 * a * b * pow(dist_squared, b - 1.0)
                grad_coeff /= a * pow(dist_squared, b) + 1.0
            else:
                grad_coeff = 0.0

            for d in range(dim):
                grad_d = clip(grad_coeff * (current[d] - other[d]))

                current[d] += grad_d * alpha
                if move_other:
                    other[d] += -grad_d * alpha

            epoch_of_next_sample[i] += epochs_per_sample[i]

            n_neg_samples = int(
                (n - epoch_of_next_negative_sample[i]) / epochs_per_negative_sample[i]
            )

            for p in range(n_neg_samples):
                k = tau_rand_int(rng_state) % n_vertices

                other = tail_embedding[k]

                dist_squared = rdist(current, other)

                if dist_squared > 0.0:
                    grad_coeff = 2.0 * gamma * b
                    grad_coeff /= (0.001 + dist_squared) * (
                        a * pow(dist_squared, b) + 1
                    )
                elif j == k:
                    continue
                else:
                    grad_coeff = 0.0

                for d in range(dim):
                    if grad_coeff > 0.0:
                        grad_d = clip(grad_coeff * (current[d] - other[d]))
                    else:
                        grad_d = 0
                    current[d] += grad_d * alpha

            epoch_of_next_negative_sample[i] += (
                n_neg_samples * epochs_per_negative_sample[i]
            )


def _optimize_ghost_layout_euclidean_single_epoch(
    ghost_embeddings,
    n_ghosts,
    ghost_mask,
    head_embedding,
    tail_embedding,
    head,
    tail,
    n_vertices,
    epochs_per_sample,
    a,
    b,
    rng_state,
    gamma,
    dim,
    move_other,
    alpha,
    epochs_per_negative_sample,
    epoch_of_next_negative_sample,
    epoch_of_next_sample,
    n,
):
    """
    ghost_embedding: array of shape (n_vertices, n_ghosts_per_target, n_components)
        Embeddings of ghosts
    has_ghost: array of shape (n_vertices)
        Whether the vertex has a ghost
    num_ghosts_per_target: int
        number of ghosts per target
    """
    # optimize ghost embedding
    for i in numba.prange(epochs_per_sample.shape[0]):
        if epoch_of_next_sample[i] <= n:
            j = head[i]  # 1st node of the ith link
            k = tail[i]  # 2nd node of the ith link, link is symmetric
        else:
            continue

        if not ghost_mask[j]:
            continue

        current_orig = head_embedding[j]
        other_orig = tail_embedding[k]

        if ghost_mask[j]:
            for g in range(n_ghosts):
                current_ghost = ghost_embeddings[j][g]

                dist_squared = rdist(
                    current_ghost, other_orig
                )  # squared euclidean distance

                if dist_squared > 0.0:  # attractive force
                    grad_coeff = -2.0 * a * b * pow(dist_squared, b - 1.0)
                    grad_coeff /= a * pow(dist_squared, b) + 1.0
                else:
                    grad_coeff = 0.0

                for d in range(dim):
                    grad_d = clip(grad_coeff * (current_ghost[d] - other_orig[d]))
                    current_ghost[d] += grad_d * alpha

                n_neg_samples = int(
                    (n - epoch_of_next_negative_sample[i])
                    / epochs_per_negative_sample[i]
                )

                for p in range(n_neg_samples):
                    neg_k = (
                        tau_rand_int(rng_state) % n_vertices
                    )  # A fast (pseudo)-random number generator.

                    other_neg = tail_embedding[neg_k]

                    dist_squared = rdist(current_ghost, other_neg)

                    if dist_squared > 0.0:  # repulsive force
                        grad_coeff = 2.0 * gamma * b
                        grad_coeff /= (0.001 + dist_squared) * (
                            a * pow(dist_squared, b) + 1
                        )
                    elif j == neg_k:
                        continue
                    else:
                        grad_coeff = 0.0

                    for d in range(dim):
                        if grad_coeff > 0.0:
                            grad_d = clip(
                                grad_coeff * (current_ghost[d] - other_neg[d])
                            )
                        else:
                            grad_d = 0
                        current_ghost[d] += grad_d * alpha

        if ghost_mask[k] and move_other:
            for g in range(n_ghosts):
                other_ghost = ghost_embeddings[k][g]

                dist_squared = rdist(current_orig, other_ghost)

                if dist_squared > 0.0:  # attractive force
                    grad_coeff = -2.0 * a * b * pow(dist_squared, b - 1.0)
                    grad_coeff /= a * pow(dist_squared, b) + 1.0
                else:
                    grad_coeff = 0.0

                for d in range(dim):
                    grad_d = clip(grad_coeff * (current_orig[d] - other_ghost[d]))
                    other_ghost[d] += -grad_d * alpha


def optimize_layout_euclidean(
    n_ghosts,
    original_embedding,
    head,
    tail,
    n_epochs,
    n_vertices,
    epochs_per_sample,
    a,
    b,
    rng_state,
    gamma=1.0,
    initial_alpha=1.0,
    negative_sample_rate=5.0,
    parallel=False,
    verbose=False,
    tqdm_kwds=None,
    move_other=False,
):
    """Improve an embedding using stochastic gradient descent to minimize the
    fuzzy set cross entropy between the 1-skeletons of the high dimensional
    and low dimensional fuzzy simplicial sets. In practice this is done by
    sampling edges based on their membership strength (with the (1-p) terms
    coming from negative sampling similar to word2vec).
    Parameters
    ----------
    n_embeddings: int
        The number of embeddings to optimize
    n_ghosts: int
        The number of ghosts per target
    original_embeddings: array of shape (n_embeddings, n_samples, n_components)
        The initial embeddings to be improved by SGD.
    head_embedding: array of shape (n_samples, n_components)
        The initial embedding to be improved by SGD.
    tail_embedding: array of shape (source_samples, n_components)
        The reference embedding of embedded points. If not embedding new
        previously unseen points with respect to an existing embedding this
        is simply the head_embedding (again); otherwise it provides the
        existing embedding to embed with respect to.
    head: array of shape (n_1_simplices)
        The indices of the heads of 1-simplices with non-zero membership.
    tail: array of shape (n_1_simplices)
        The indices of the tails of 1-simplices with non-zero membership.
    n_epochs: int, or list of int
        The number of training epochs to use in optimization, or a list of
        epochs at which to save the embedding. In case of a list, the optimization
        will use the maximum number of epochs in the list, and will return a list
        of embedding in the order of increasing epoch, regardless of the order in
        the epoch list.
    n_vertices: int
        The number of vertices (0-simplices) in the dataset.
    epochs_per_sample: array of shape (n_1_simplices)
        A float value of the number of epochs per 1-simplex. 1-simplices with
        weaker membership strength will have more epochs between being sampled.
    a: float
        Parameter of differentiable approximation of right adjoint functor
    b: float
        Parameter of differentiable approximation of right adjoint functor
    rng_state: array of int64, shape (3,)
        The internal state of the rng
    gamma: float (optional, default 1.0)
        Weight to apply to negative samples.
    initial_alpha: float (optional, default 1.0)
        Initial learning rate for the SGD.
    negative_sample_rate: int (optional, default 5)
        Number of negative samples to use per positive sample.
    parallel: bool (optional, default False)
        Whether to run the computation using numba parallel.
        Running in parallel is non-deterministic, and is not used
        if a random seed has been set, to ensure reproducibility.
    verbose: bool (optional, default False)
        Whether to report information on the current progress of the algorithm.
    densmap: bool (optional, default False)
        Whether to use the density-augmented densMAP objective
    densmap_kwds: dict (optional, default None)
        Auxiliary data for densMAP
    tqdm_kwds: dict (optional, default None)
        Keyword arguments for tqdm progress bar.
    move_other: bool (optional, default False)
        Whether to adjust tail_embedding alongside head_embedding
    Returns
    -------
    embedding: array of shape (n_samples, n_components)
        The optimized embedding.
    """

    config = get_config()
    (
        radii,
        sensitivity,
        ghost_gen,
        dropping,
        init_dropping,
        mov_avg_weight,
        bm_type,
    ) = asdict(config).values()

    dim = original_embedding.shape[1]
    alpha = initial_alpha

    epochs_per_negative_sample = epochs_per_sample / negative_sample_rate
    epoch_of_next_negative_sample = epochs_per_negative_sample.copy()
    epoch_of_next_sample = epochs_per_sample.copy()

    optimize_real_fn = numba.njit(
        _optimize_real_layout_euclidean_single_epoch,
        fastmath=True,
        parallel=parallel,
    )

    optimize_ghost_fn = numba.njit(
        _optimize_ghost_layout_euclidean_single_epoch,
        fastmath=True,
        parallel=parallel,
    )

    if tqdm_kwds is None:
        tqdm_kwds = {}

    epochs_list = None

    if isinstance(n_epochs, list):
        epochs_list = n_epochs
        n_epochs = max(epochs_list)

    if "disable" not in tqdm_kwds:
        tqdm_kwds["disable"] = not verbose

    ghost_embeddings = None

    # for dropping ghosts
    ghost_mask = np.ones(n_vertices, dtype=np.bool_)
    distance_list = []
    thresholds = []

    init_radii = None

    for n in tqdm(range(n_epochs), **tqdm_kwds):
        if ghost_embeddings is None and n >= int(n_epochs * ghost_gen):
            if verbose:
                print(f"Generating ghosts at epoch {n}")
            ghost_embeddings = sample_ghosts(original_embedding, n_ghosts, r=radii)
            init_radii = compute_distances(
                original_embedding, ghost_embeddings
            ) / _get_max_extent(original_embedding)

        if ghost_embeddings is not None:
            optimize_ghost_fn(
                ghost_embeddings,
                n_ghosts,
                ghost_mask,
                original_embedding.astype(np.float32),
                original_embedding.astype(np.float32),
                head,
                tail,
                n_vertices,
                epochs_per_sample,
                a,
                b,
                rng_state,
                gamma,
                dim,
                move_other,
                alpha,
                epochs_per_negative_sample,
                epoch_of_next_negative_sample,
                epoch_of_next_sample,
                n,
            )

        optimize_real_fn(
            original_embedding,
            original_embedding,
            head,
            tail,
            n_vertices,
            epochs_per_sample,
            a,
            b,
            rng_state,
            gamma,
            dim,
            move_other,
            alpha,
            epochs_per_negative_sample,
            epoch_of_next_negative_sample,
            epoch_of_next_sample,
            n,
        )

        alpha = initial_alpha * (1.0 - (float(n) / float(n_epochs)))

        if verbose and n % int(n_epochs / 10) == 0:
            print("\tcompleted ", n, " / ", n_epochs, "epochs")

        if ghost_embeddings is not None and dropping:
            _update_distances(
                distance_list,
                thresholds,
                original_embedding,
                ghost_embeddings,
                ghost_mask,
                sensitivity,
                mov_avg_weight,
            )

            _drop_ghosts_if_needed(
                n,
                n_epochs,
                init_dropping,
                ghost_mask,
                distance_list,
                thresholds,
            )

    set_results(
        distance_list=np.array(distance_list),
        threshold_list=np.array(thresholds),
        init_radii=init_radii,
    )

    return (original_embedding, ghost_embeddings, ghost_mask)


def _update_distances(
    distance_list: list,
    thresholds: list,
    original_embedding,
    ghost_embeddings,
    ghost_mask,
    sensitivity,
    mov_avg_weight,
):
    if not distance_list:
        distance_list.append(
            get_distance(
                original_embedding,
                ghost_embeddings,
                ghost_mask,
                sensitivity=sensitivity,
            )
        )

        thresholds.append(np.mean(distance_list[-1]))

    else:
        distances = np.copy(distance_list[-1])
        distances[ghost_mask] = get_distance(
            original_embedding,
            ghost_embeddings,
            ghost_mask,
            sensitivity=sensitivity,
        )

        mov_avg_dist = (
            np.copy(distance_list[-1]) * mov_avg_weight
            + (1 - mov_avg_weight) * distances
        )

        distance_list.append(mov_avg_dist)
        thresholds.append(np.mean(mov_avg_dist))


def _drop_ghosts_if_needed(
    epoch, n_epochs, init_dropping, ghost_mask, distance_list, thresholds
):
    if epoch >= int(n_epochs * init_dropping):
        active_indices = np.where(ghost_mask)[0]
        ghost_to_drop = distance_list[-1][ghost_mask] < thresholds[-1]

        ghost_mask[active_indices[ghost_to_drop]] = False
    return ghost_mask
