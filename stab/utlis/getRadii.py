import numpy as np


def get_radii(
    original_embedding: np.ndarray, ghost_embeddings: np.ndarray
) -> np.ndarray:
    radii = np.sum(
        (ghost_embeddings - original_embedding[:, np.newaxis, :]) ** 2, axis=2
    )
    radii **= 0.5

    radii = np.sort(radii, axis=1)

    return radii
