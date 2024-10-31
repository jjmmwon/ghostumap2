from .model import TDataName, DataModel

from .mnistSeries import MnistSeriesLoader
from .celegans import CelegansLoader


class DataLoader:
    def __init__(self, data_name: TDataName = "mnist"):
        self.data_name = data_name
        self.loader = self._get_loader()

    def _get_loader(self):
        if self.data_name in ["mnist", "fmnist", "kmnist"]:
            return MnistSeriesLoader(self.data_name)
        elif self.data_name == "celegans":
            return CelegansLoader()
        else:
            raise ValueError("Invalid type")

    def get_data(self) -> DataModel:
        return self.loader.get_data()

    def get_precomputed_knn(self, n_neighbors: int = 15):
        return self.loader.get_precomputed_knn(n_neighbors)
