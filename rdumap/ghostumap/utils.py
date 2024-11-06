import numpy as np


def sample_ghosts(
    original_embedding: np.ndarray,
    n_samples: int,
    r: float = 0.1,
) -> np.ndarray:

    max_dist = _get_max_dist(original_embedding)

    r1, r2 = (0, r * max_dist)

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


def drop_ghosts(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    alive_ghosts: np.ndarray,
    sensitivity: float = 0.9,
    distance: int = 0.1,
) -> np.ndarray:
    # print(np.sum(alive_ghosts))

    alive_indices = np.where(alive_ghosts)[0]

    distances = _get_distance(
        original_embedding, ghost_embeddings, alive_ghosts, sensitivity
    )

    dropped_idx = np.where(distances < distance)[0]

    alive_ghosts[alive_indices[dropped_idx]] = False

    # print(np.sum(alive_ghosts))
    return alive_ghosts


def _get_distance(
    original_embedding: np.ndarray,
    ghost_embeddings: np.ndarray,
    alive_ghosts: np.ndarray,
    sensitivity: float = 0.9,
) -> np.ndarray:
    radii = _get_radii(original_embedding[alive_ghosts], ghost_embeddings[alive_ghosts])
    max_dist = _get_max_dist(original_embedding)
    boundary = np.ceil((ghost_embeddings.shape[1] - 1) * sensitivity).astype(int)

    distances = radii[:, boundary] / max_dist

    return distances


def _get_max_dist(original_embedding: np.ndarray) -> np.ndarray:
    x_range = np.max(original_embedding[:, 0]) - np.min(original_embedding[:, 0])
    y_range = np.max(original_embedding[:, 1]) - np.min(original_embedding[:, 1])
    max_dist = np.max([x_range, y_range])

    return max_dist


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
    alive_ghosts: np.ndarray,
):
    O = original_embedding[alive_ghosts]
    G = ghost_embeddings[alive_ghosts]

    Y = np.concatenate([O[:, np.newaxis], G], axis=1)

    Mu = np.mean(Y, axis=1)

    INS = np.sum(np.square(Y - Mu[:, np.newaxis]), axis=2)
    INS = np.mean(INS, axis=1)

    rank = np.argsort(INS)[::-1]
    score = INS[rank]

    rank = np.where(alive_ghosts)[0][rank]

    return rank, score
