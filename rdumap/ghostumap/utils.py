import numpy as np


def sample_ghosts(
    original_embedding: np.ndarray,
    n_samples: int,
    r: float = 0.1,
) -> np.ndarray:
    """
    Sample ghost projections around the original projections within a radius r
    """

    max_dist = _get_max_extent(original_embedding)

    r1, r2 = (0, r * max_dist)

    n_points = original_embedding.shape[0]

    theta = np.random.uniform(0, 2 * np.pi, (n_points, n_samples))
    radii = np.random.uniform(r1, r2, (n_points, n_samples))

    dx = radii * np.cos(theta)
    dy = radii * np.sin(theta)

    samples = np.empty((n_points, n_samples, 2))
    samples = original_embedding[:, np.newaxis, :] + np.stack([dx, dy], axis=-1)

    return np.array(samples, dtype=np.float32, order="C")


def drop_ghosts(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    ghost_mask: np.ndarray,
    sensitivity: float = 1,
    distance: int = 0.1,
) -> np.ndarray:
    """
    Drop stable ghosts based on the distance
    """

    active_indices = np.where(ghost_mask)[0]

    distances = get_distance(
        original_embedding, ghost_embeddings, ghost_mask, sensitivity
    )

    dropped_idx = np.where(distances < distance)[0]

    ghost_mask[active_indices[dropped_idx]] = False

    return ghost_mask


def get_distance(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    ghost_mask: np.ndarray,
    sensitivity: float = 1,
) -> np.ndarray:
    """
    Compute the distance d of each data point
    """

    max_extent = _get_max_extent(original_embedding)
    boundary = np.ceil((ghost_embeddings.shape[1] - 1) * sensitivity).astype(int)

    distances = compute_distances(
        original_embedding[ghost_mask], ghost_embeddings[ghost_mask]
    )
    distances = np.sort(distances, axis=1)
    D = distances[:, boundary] / max_extent

    return D


def _get_max_extent(original_embedding: np.ndarray) -> np.ndarray:
    """
    Compute the maximum extent of the embedding
    """

    x_range = np.max(original_embedding[:, 0]) - np.min(original_embedding[:, 0])
    y_range = np.max(original_embedding[:, 1]) - np.min(original_embedding[:, 1])
    max_extent = np.max([x_range, y_range])

    return max_extent


def compute_distances(
    original_embedding: np.ndarray, ghost_embeddings: np.ndarray
) -> np.ndarray:
    """
    Compute the distances between the original projection and its ghost projections
    """

    distances = np.sum(
        (ghost_embeddings - original_embedding[:, np.newaxis, :]) ** 2, axis=2
    )
    distances **= 0.5

    return distances


def _measure_instability(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    ghost_mask: np.ndarray,
):
    O = original_embedding[ghost_mask]
    G = ghost_embeddings[ghost_mask]

    Y = np.concatenate([O[:, np.newaxis], G], axis=1)

    Mu = np.mean(Y, axis=1)

    INS = np.sum(np.square(Y - Mu[:, np.newaxis]), axis=2)
    INS = np.mean(INS, axis=1)

    rank = np.argsort(INS)[::-1]
    score = INS[rank]

    rank = np.where(ghost_mask)[0][rank]

    return rank, score
