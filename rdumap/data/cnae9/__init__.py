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
        self._load_data()

    def _load_data(self):
        paths = {
            "data": os.path.join(self.base_path, "data.npy"),
            "label": os.path.join(self.base_path, "label.npy"),
            "knn_indices": os.path.join(self.base_path, "knn_indices.npy"),
            "knn_dists": os.path.join(self.base_path, "knn_dists.npy"),
            "legend": os.path.join(self.base_path, "legend.json"),
        }

        if not os.path.exists(paths["data"]):
            self._load_raw_data()
            return

        self._data = np.load(paths["data"])
        self._label = (
            np.load(paths["label"]) if os.path.exists(paths["label"]) else None
        )
        self._precomputed_knn = (
            (
                np.load(paths["knn_indices"]),
                np.load(paths["knn_dists"]),
            )
            if os.path.exists(paths["knn_indices"])
            and os.path.exists(paths["knn_dists"])
            else (None, None)
        )

        self._legend = (
            json.load(open(paths["legend"])).get("legend")
            if os.path.exists(paths["legend"])
            else None
        )

    def _load_raw_data(self):
        import pandas as pd

        data = pd.read_csv(os.path.join(self.base_path, "CNAE-9.data"), header=None)

        X = data.values[:, 1:]
        y = data.values[:, 0]

        self._data = X
        self._label = y
        self._legend = [f"{i}" for i in range(10)]

        reducer = UMAP()
        _ = reducer.fit_transform(X)
        self._precomputed_knn = (reducer.precomputed_knn[0], reducer.precomputed_knn[1])

        np.save("data.npy", self._data)
        np.save("label.npy", self._label)
        np.save("knn_indices.npy", self._precomputed_knn[0])
        np.save("knn_dists.npy", self._precomputed_knn[1])

        with open("legend.json", "w") as f:
            json.dump({"legend": self._legend}, f)

    def get_data(self):
        return super().get_data()
