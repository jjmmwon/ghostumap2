from typing import Literal, TypedDict

import numpy as np


TprecomputedKnn = (
    tuple[np.ndarray, np.ndarray]
    | tuple[np.ndarray, np.ndarray, np.ndarray]
    | tuple[None, None]
    | tuple[None, None, None]
)

TDataName = Literal[
    "mnist",
    "fmnist",
    "kmnist",
    "celegans",
    "ionosphere",
    "optical_recognition",
    "raisin",
    "htru2",
    "parishousing",
    "cnae9",
    "20ng",
    "ag_news",
    "amazon_polarity",
    "yelp_review",
]


class DataModel(TypedDict):
    data: np.ndarray
    label: np.ndarray | None
    legend: dict | None
    precomputed_knn: TprecomputedKnn = (None, None)
