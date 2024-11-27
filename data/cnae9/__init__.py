import os
import json

from ..BaseLoader import BaseLoader

import numpy as np

from umap import UMAP


class Cnae9Loader(BaseLoader):
    def __init__(self):
        super().__init__()
        self.name = "cnae9"
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.load_data()

    def load_raw_data(self):
        import pandas as pd

        data = pd.read_csv(os.path.join(self.base_path, "CNAE-9.data"), header=None)

        X = data.values[:, 1:]
        y = data.values[:, 0]

        self._data = self.scale_data(X)
        self._label = y
        self._legend = [f"{i}" for i in range(10)]
        self._precomputed_knn = self.get_precomputed_knn(self._data)

        self.save_data(self.base_path)

    def get_data(self):
        return super().get_data()
