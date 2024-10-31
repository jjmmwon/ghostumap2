from dataclasses import asdict
import numpy as np

from .types import THyperparameter, TResult, Tbenchmark
from rdumap.ghostumap import GhostUMAP


def run_GhostUMAP(
    X: np.ndarray,
    hyperparameters: THyperparameter,
    bm_type: Tbenchmark,
    precomputed_knn=(None, None, None),
    distance=0.1,
) -> TResult:
    """
    Run grid search.
    """

    gu = GhostUMAP(precomputed_knn=precomputed_knn)

    O, G, alive_ghosts = gu.fit_transform(X, bm_type=bm_type, **hyperparameters)
    unstable_ghosts = (
        gu.get_unstable_ghosts(
            distance=distance,
            sensitivity=hyperparameters["sensitivity"],
        )
        if bm_type == "accuracy"
        else np.array([])
    )
    result = asdict(gu.get_results())

    result["original_embedding"] = O
    result["ghost_embedding"] = G
    result["alive_ghosts"] = alive_ghosts
    result["unstable_ghosts"] = unstable_ghosts

    return result


def measure_accuracy(y_true, y_pred):
    TP = np.sum(np.logical_and(y_true == 1, y_pred == 1))
    FP = np.sum(np.logical_and(y_true == 0, y_pred == 1))
    FN = np.sum(np.logical_and(y_true == 1, y_pred == 0))
    TN = np.sum(np.logical_and(y_true == 0, y_pred == 0))

    precision = TP / (TP + FP)
    recall = TP / (TP + FN)

    f1 = 2 * (precision * recall) / (precision + recall)

    return f1, precision, recall


__all__ = ["run_GhostUMAP", "measure_accuracy"]
