from typing import Tuple, Union
import numpy as np

TNumber = Union[int, float]


def _sample_ghosts(
    original_embedding: np.ndarray,
    n_samples: int,
    r: Union[TNumber, Tuple[TNumber, TNumber]] = 1.0,
) -> np.ndarray:
    r1, r2 = min(r), max(r) if isinstance(r, tuple) else (0, r)

    n_points = original_embedding.shape[0]

    angles = np.random.uniform(0, 2 * np.pi, (n_points, n_samples))
    radii = np.random.uniform(r1, r2, (n_points, n_samples))

    x_offsets = radii * np.cos(angles)
    y_offsets = radii * np.sin(angles)

    samples = np.empty((n_points, n_samples, 2))
    samples = original_embedding[:, np.newaxis, :] + np.stack(
        [x_offsets, y_offsets], axis=-1
    )

    return np.array(samples, dtype=np.float32, order="C")


def _get_radii(
    original_embedding: np.ndarray, ghost_embeddings: np.ndarray
) -> np.ndarray:
    radii = np.sum(
        (ghost_embeddings - original_embedding[:, np.newaxis, :]) ** 2, axis=2
    )
    radii **= 0.5

    radii = np.sort(radii, axis=1)

    return radii


def _measure_instability(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    ghost_indices: np.ndarray = None,
):
    """
    Calculate the variance of the original and ghost points within embeddings.

    Parameters
    ----------
    original_embeddings: np.ndarray of shape (n_samples, n_components)
    ghost_embeddings: np.ndarray of shape (n_samples, n_ghosts, n_components)
    ghost_indices: np.ndarray of shape (n_ghost_targets,)

    Returns
    -------
    rank: np.ndarray of shape (n_ghost_targets,)
        The rank of the ghosts based on the variance.
    score: np.ndarray of shape (n_ghost_targets,)
        The variance of the ghosts.
    """

    Y = np.concatenate([original_embedding[:, np.newaxis], ghost_embeddings], axis=1)
    # shape of Y: (n_samples, n_ghosts+1, n_components)

    Mu = np.mean(Y, axis=1)  # shape of Mu: (n_samples, n_components)

    INS = np.sum(np.square(Y - Mu[:, np.newaxis]), axis=2)
    INS = np.mean(INS, axis=1)
    # shape of INS: (n_samples,)

    rank = np.argsort(INS)[::-1]
    score = INS[rank]

    rank = ghost_indices[rank]

    return rank, score
