from typing import Literal, TypedDict
import numpy as np


class THyperparameter(TypedDict):
    n_ghosts: int
    radii: float
    sensitivity: float
    ghost_gen: float
    init_dropping: float
    mov_avg_weight: float


class TResult(TypedDict):
    opt_time: float
    original_embedding: np.ndarray
    ghost_embedding: np.ndarray
    alive_ghosts: np.ndarray
    unstable_ghosts: np.ndarray
    distance_list: np.ndarray
    threshold_list: np.ndarray


Tbenchmark = Literal["accuracy", "time_with_dropping", "time_without_dropping"]


__all__ = [
    "THyperparameter",
    "TResult",
    "Tbenchmark",
]
