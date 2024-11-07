import os
import json

from ..BaseLoader import BaseLoader

import numpy as np

from umap import UMAP


class ParisHousingLoader(BaseLoader):
    def __init__(self):
        super().__init__()
        self.name = "parishousing"
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.load_data()

    def load_raw_data(self):
        import pandas as pd

        data = pd.read_csv(os.path.join(self.base_path, "ParisHousingClass.csv"))

        X = data.drop("category", axis=1).values
        y = data["category"].values

        self._data = self.scale_data(X)
        self._label = np.array([0 if i == "Basic" else 1 for i in y])
        self._legend = ["Basic", "Luxury"]
        self._precomputed_knn = self.get_precomputed_knn(self._data)

        self.save_data(self.base_path)
