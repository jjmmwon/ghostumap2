import json
import os
from typing import Literal
from ..BaseLoader import BaseLoader

import numpy as np


TextEmbtypes = Literal["20ng", "ag_news", "amazon_polarity", "yelp_review"]


class TextEmbeddingLoader(BaseLoader):
    def __init__(self, name: TextEmbtypes = "20ng"):
        super().__init__()
        self.name = name
        self.base_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), self.name
        )
        self.load_data()

    def load_raw_data(self):
        self._data = np.load(os.path.join(self.base_path, "data.npy"))
        self._label = np.load(os.path.join(self.base_path, "label.npy"))
        self._legend = json.load(open(os.path.join(self.base_path, "legend.json"))).get(
            "legend"
        )

        self._precomputed_knn = self.get_precomputed_knn(self._data)

        self.save_data(self.base_path)
