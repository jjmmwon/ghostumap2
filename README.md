<p align="center">
  <h2 align="center">GhostUMAP2</h2>
	<h3 align="center">Ensuring the Stability of Dimensionality Reduction with GhostUMAP</h3>
</p>

### Installation

```Bash
git clone https://github.com/jjmmwon/rdumap.git
cd rdumap
hatch shell
```

### How to use GhostUMAP
```Python
from rdumap import GhostUMAP
from sklearn.datasets import fetch_openml

mnist = fetch_openml("mnist_784")
X, y = mnist["data"], mnist["target"]

mapper = GhostUMAP()
O, G, active_ghosts = mapper.fit_transform(X, n_ghosts=16) 

mapper.visualize(label=y, legend=[str(i) for i in range(10)])
```


## API
### Function 'fit_transform'
Fit X into an embedded space with ghosts and return the transformed outputs.

**Parameters**
- `X`: array, shape (n_samples, n_features) or (n_samples, n_samples). If the metric is 'precomputed' X must be a square distance matrix. Otherwise, it contains a sample per row.
- `force_all_finite`: Whether to raise an error on np.inf, np.nan, pd.NA in array. Default is True.
- `n_ghosts`: The number of ghost points to embed in the embedding space. Default is 8.
- `radii`: Radius for ghost generation. Default is 0.1.
- `sensitivity`: Sensitivity for ghost dropping. Default is 1.
- `ghost_gen`: Ghost generation parameter. Default is 0.2.
- `dropping`: Whether to drop ghosts during optimization. Default is True.
- `init_dropping`: Initial dropping parameter. Default is 0.4.

**Returns**
- `embedding`: array, shape (n_samples, n_components). The transformed samples in the embedded space.
- `ghost_embedding`: array, shape (n_samples, n_ghosts, n_components). The transformed ghost points in the embedded space.
- `ghost_indices`: array, shape (n_remaining_ghosts,). The indices of the ghost points in the original data.

### Function 'visualize'
Creates and returns an interactive visualization widget.

**Parameters**
- `title`: Title of the visualization. Default is None.
- `label`: Labels for the data points. Default is None.
- `legend`: Legend for the visualization. Default is None.

**Returns**
- `widget`: An interactive visualization widget.

### Function 'get_distances'
Get the distances between original and ghost embeddings.

**Parameters**
- `sensitivity`: Sensitivity for distance calculation. Default is 1.

**Returns**
- `distances`: array, shape (n_samples,). The distances between original and ghost embeddings.

### Function 'get_unstable_ghosts'
Get the indices of unstable ghost points.

**Parameters**
- `distance`: Distance threshold for determining instability. Default is 0.1.
- `sensitivity`: Sensitivity for instability calculation. Default is 1.

**Returns**
- `unstable_ghosts`: array, shape (n_remaining_ghosts,). The indices of the unstable ghost points.





