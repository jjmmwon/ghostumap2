import json
import os
from abc import ABC, abstractmethod

import numpy as np
from umap import UMAP

from .model import DataModel


class BaseLoader(ABC):
    def __init__(self):
        self.base_path = None
        self._data = None
        self._label = None
        self._legend = None
        self._precomputed_knn = None

    @abstractmethod
    def load_raw_data(self):
        pass

    def drop_cache(self, paths):
        for path in paths:
            if os.path.exists(path):
                os.remove(path)

    def load_data(self):
        paths = {
            "data": os.path.join(self.base_path, "data.npy"),
            "label": os.path.join(self.base_path, "label.npy"),
            "legend": os.path.join(self.base_path, "legend.json"),
            "knn_indices": os.path.join(self.base_path, "knn_indices.npy"),
            "knn_dists": os.path.join(self.base_path, "knn_dists.npy"),
        }

        if not all(os.path.exists(path) for path in paths.values()):
            self.load_raw_data()
            return

        self._data = np.load(paths["data"], mmap_mode=None)
        self._label = np.load(paths["label"], mmap_mode=None)
        self._precomputed_knn = (
            (
                np.load(paths["knn_indices"], mmap_mode=None),
                np.load(paths["knn_dists"], mmap_mode=None),
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

    def get_data(self) -> DataModel:
        result = {
            "data": self._data,
            "label": self._label,
            "legend": self._legend,
            "precomputed_knn": self._precomputed_knn,
        }

        return result

    def save_data(self, path):
        save_if_not_exists(path, self._data)
        save_if_not_exists(path, self._label)

        if self._precomputed_knn[0] is not None:
            save_if_not_exists(
                os.path.join(path, "knn_indices.npy"), self._precomputed_knn[0]
            )
            save_if_not_exists(
                os.path.join(path, "knn_dists.npy"), self._precomputed_knn[1]
            )

        legend_path = os.path.join(path, "legend.json")
        if not os.path.exists(legend_path):
            with open(os.path.join(path, "legend.json"), "w") as f:
                json.dump({"legend": self._legend}, f)

    def scale_data(self, data: np.ndarray):
        from sklearn.preprocessing import StandardScaler

        scaler = StandardScaler()
        return scaler.fit_transform(data)

    def get_precomputed_knn(self, X, n_neighbors: int = 15):
        if X.shape[0] < 4096:
            self._precomputed_knn = (None, None)
            return self._precomputed_knn

        reducer = UMAP(n_neighbors=n_neighbors)
        _ = reducer.fit_transform(X)
        self._precomputed_knn = (reducer._knn_indices, reducer._knn_dists)

        return self._precomputed_knn


def save_if_not_exists(file_path, data):
    if not os.path.exists(file_path):
        np.save(file_path, data)
