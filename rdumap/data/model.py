from typing import Literal, TypedDict

import numpy as np


TprecomputedKnn = (
    tuple[np.ndarray, np.ndarray]
    | tuple[np.ndarray, np.ndarray, np.ndarray]
    | tuple[None, None]
    | tuple[None, None, None]
)

TDataName = Literal["mnist", "fmnist", "kmnist", "celegans"]


class DataModel(TypedDict):
    data: np.ndarray
    label: np.ndarray | None
    label_dict: dict | None
    precomputed_knn: TprecomputedKnn = (None, None)
