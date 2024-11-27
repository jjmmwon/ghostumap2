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
        self.base_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), self.name
        )
        self.load_data()

    def load_raw_data(self):
        self._data = np.load(os.path.join(self.base_path, "data.npy"))
        self._label = np.load(os.path.join(self.base_path, "label.npy"))
        self._data = self.scale_data(self._data)
        self._legend = [label_dict[self.name][i] for i in range(10)]

        self._precomputed_knn = self.get_precomputed_knn(self._data)

        self.save_data(self.base_path)
