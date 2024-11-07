import os
from typing import Literal
from ..BaseLoader import BaseLoader

import numpy as np


MnistType = Literal["mnist", "fmnist", "kmnist"]

label_dict = {
    "mnist": {
        0: "0",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
    },
    "fmnist": {
        0: "T-shirt/top",
        1: "Trouser",
        2: "Pullover",
        3: "Dress",
        4: "Coat",
        5: "Sandal",
        6: "Shirt",
        7: "Sneaker",
        8: "Bag",
        9: "Ankle boot",
    },
    "kmnist": {
        0: "O",
        1: "Ki",
        2: "Su",
        3: "TSU",
        4: "Na",
        5: "Ha",
        6: "Ma",
        7: "Ya",
        8: "Re",
        9: "Wo",
    },
}


class MnistSeriesLoader(BaseLoader):
    def __init__(self, name: MnistType = "mnist"):
        super().__init__()
        self.name = name
        self.data_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), self.name
        )
        self._load_data()

    def _load_data(self):
        paths = {
            "data": os.path.join(self.data_path, f"{self.name}.npy"),
            "label": os.path.join(self.data_path, "label.npy"),
            "knn_dists": os.path.join(self.data_path, "knn_dists.npy"),
            "knn_indices": os.path.join(self.data_path, "knn_indices.npy"),
        }

        self._data = np.load(paths["data"])

        self._label = (
            np.load(paths["label"]) if os.path.exists(paths["label"]) else None
        )

        self._legend = list(label_dict[self.name].values())

        self._precomputed_knn = (
            (
                np.load(paths["knn_indices"]),
                np.load(paths["knn_dists"]),
            )
            if os.path.exists(paths["knn_indices"])
            and os.path.exists(paths["knn_dists"])
            else self.get_precomputed_knn()
        )

    def load_raw_data(self):
        raise NotImplementedError

    def get_data(self):
        return super().get_data()

    def get_precomputed_knn(self, n_neighbors: int = 15):
        return super().get_precomputed_knn(n_neighbors)
