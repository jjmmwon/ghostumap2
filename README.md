<p align="center">
  <h2 align="center">GhostUMAP2</h2>
	<h3 align="center">Measuring and Analyzing <i>(r,d)</i>-Stability of UMAP</h3>
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
```Python
def fit_transform(X, n_ghosts, r, ghost_gen, dropping, init_dropping):
```
Fit X into an embedded space with ghosts and return the transformed outputs.

#### **Parameters**
> - `X`: array, shape (n_samples, n_features) or (n_samples, n_samples). If the metric is 'precomputed' X must be a square distance matrix. Otherwise, it contains a sample per row.

> **Ghost Configuration**
> - `n_ghosts`: The number of ghost points to embed in the embedding space. Default is 16.
> - `r`: Radius for ghost generation. Default is 0.1.
> - `ghost_gen`: Ghost generation parameter. Default is 0.2.

> **Dropping Scheme**
> - `dropping`: Whether to drop ghosts during optimization. Default is True.
> - `init_dropping`: Initial dropping parameter. Default is 0.4.

#### **Returns**
> - ```O: array, shape (n_samples, n_components)```
Embedding of the original data points, identical to the output of UMAP. It represents the transformed coordinates in the low-dimensional space.
> - ```G: array, shape (n_samples, n_ghosts, n_components)```
Embedding of ghost points which are clones of the original points. These ghost points are used to evaluate the instability of each data instance.
> - ```active_ghosts: array, shape (n_samples,)``` 
Boolean array indicating the presence of active ghost points for each data instance.


### Function 'visualize'
```Python
def visualize(title=None, label=None, legend=None):
```
Returns an interactive visualization widget.

#### **Parameters**
> - `title`: Title of the visualization.
> - `label`: Labels for the data points.
> - `legend`: Legend for the visualization.

#### **Returns**
> - `widget`: An interactive visualization widget.

### Function 'get_distances'
Get the distances between the original and ghost projections.
```Python
def get_distances(sensitivity=1):
```
**Parameters**

`sensitivity`: Sensitivity for distance calculation. Default is 1.

**Returns**

`distances`: array, shape (n_samples,). The distances between original and ghost embeddings.

### Function 'get_unstable_ghosts'
Get the boolean array indicating unstable ghost points.
```Python
def get_unstable_ghosts(distance=0.1, sensitivity=1):
```
**Parameters**

`distance`: Distance threshold for determining instability. Default is 0.1.
`sensitivity`: Sensitivity for instability calculation. Default is 1.

**Returns**

unstable_ghosts`: array, shape (n_samples,).





