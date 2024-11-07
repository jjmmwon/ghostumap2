import os
import json
from typing import Literal

from ..BaseLoader import BaseLoader

import numpy as np
import pandas as pd

from umap import UMAP

TUciml = Literal["ionosphere", "optical_recognition", "raisin", "htru2"]

data_id = {
    "ionosphere": 52,
    "optical_recognition": 80,
    "raisin": 850,
    "htru2": 372,
}

legend_to_label = {
    "ionosphere": {
        "g": 0,
        "b": 1,
    },
    "optical_recognition": {
        "0": 0,
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 5,
        "6": 6,
        "7": 7,
        "8": 8,
        "9": 9,
    },
    "raisin": {
        "Kecimen": 0,
        "Besni": 1,
    },
    "htru2": {
        "0": 0,
        "1": 1,
    },
}


class UcimlLoader(BaseLoader):
    def __init__(self, name: TUciml = "ionosphere"):
        super().__init__()
        self.name = name
        self.data_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), self.name
        )
        self.paths = {
            "data": os.path.join(self.data_path, "data.npy"),
            "label": os.path.join(self.data_path, "label.npy"),
            "knn_indices": os.path.join(self.data_path, "knn_indices.npy"),
            "knn_dists": os.path.join(self.data_path, "knn_dists.npy"),
            "legend": os.path.join(self.data_path, "legend.json"),
        }
        self._load_data()

    def _load_data(self):
        if not os.path.exists(self.paths["data"]):
            self._load_raw_data()
            return

        self._data = np.load(self.paths["data"])
        self._label = (
            np.load(self.paths["label"])
            if os.path.exists(self.paths["label"])
            else None
        )
        self._precomputed_knn = (
            (
                np.load(self.paths["knn_indices"]),
                np.load(self.paths["knn_dists"]),
            )
            if os.path.exists(self.paths["knn_indices"])
            and os.path.exists(self.paths["knn_dists"])
            else (None, None)
        )

        self._legend = (
            json.load(open(self.paths["legend"])).get("legend")
            if os.path.exists(self.paths["legend"])
            else None
        )

    def _load_raw_data(self):
        from ucimlrepo import fetch_ucirepo

        fetched_data = fetch_ucirepo(id=data_id[self.name])

        # data (as pandas dataframes)
        X = fetched_data.data.features.values
        y = fetched_data.data.targets.values.flatten()

        self._data = X
        self._label = np.array([legend_to_label[self.name][label] for label in y])
        self._legend = list(legend_to_label[self.name].keys())

        reducer = UMAP()
        _ = reducer.fit_transform(X)
        self._precomputed_knn = (reducer.precomputed_knn[0], reducer.precomputed_knn[1])

        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path)

        np.save(self.paths["data"], self._data)
        np.save(self.paths["label"], self._label)
        np.save(self.paths["knn_indices"], self._precomputed_knn[0])
        np.save(self.paths["knn_dists"], self._precomputed_knn[1])

        with open("legend.json", "w") as f:
            json.dump({"legend": self._legend}, f)

    def get_data(self):
        return super().get_data()
