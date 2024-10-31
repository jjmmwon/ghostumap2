import os

import numpy as np
from umap.umap_ import nearest_neighbors

from .model import TprecomputedKnn, DataModel


class BaseLoader:
    def __init__(self):
        self.data_path = None
        self._data = None
        self._label = None
        self._legend = None
        self._precomputed_knn: TprecomputedKnn = (None, None)

    def get_precomputed_knn(self, n_neighbors: int = 15):
        if self._data is None:
            raise ValueError("Data is not loaded")

        if self._precomputed_knn[0] is not None:
            return self._precomputed_knn
        self._precomputed_knn = nearest_neighbors(
            self._data,
            n_neighbors,
            metric="euclidean",
            metric_kwds={},
            angular=False,
            random_state=None,
        )
        self._precomputed_knn = (
            self._precomputed_knn[0],
            self._precomputed_knn[1],
        )
        if self.data_path is None:
            return self._precomputed_knn

        save_path = os.path.join(self.data_path, f"precomputed_knn_{n_neighbors}")

        if not os.path.exists(save_path):
            os.makedirs(save_path)
            np.save(os.path.join(save_path, "knn_dists.npy"), self._precomputed_knn[0])
            np.save(
                os.path.join(save_path, "knn_indices.npy"), self._precomputed_knn[1]
            )

        return self._precomputed_knn

    def get_data(self) -> DataModel:
        result = {
            "data": self._data,
            "label": self._label,
            "legend": self._legend,
            "precomputed_knn": (
                self._precomputed_knn
                # if self._precomputed_knn[0] is not None
                # else self.get_precomputed_knn()
            ),
        }

        return result
