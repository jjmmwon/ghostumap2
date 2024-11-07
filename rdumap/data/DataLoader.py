from .model import TDataName, DataModel

from .mnistSeries import MnistSeriesLoader
from .celegans import CelegansLoader
from .uciml import UcimlLoader
from .cnae9 import Cnae9Loader
from .parishousing import ParisHousingLoader


class DataLoader:
    def __init__(self, data_name: TDataName = "mnist"):
        self.data_name = data_name
        self.loader = self._get_loader()

    def _get_loader(self):
        if self.data_name in ["mnist", "fmnist", "kmnist"]:
            return MnistSeriesLoader(self.data_name)
        elif self.data_name == "celegans":
            return CelegansLoader()
        elif self.data_name in [
            "ionosphere",
            "optical_recognition",
            "raisin",
            "htru2",
        ]:
            return UcimlLoader(self.data_name)
        elif self.data_name == "parishousing":
            return ParisHousingLoader()
        elif self.data_name == "cnae9":
            return Cnae9Loader()

        else:
            raise ValueError("Invalid type")

    def get_data(self) -> DataModel:
        return self.loader.get_data()
