import os

from ..BaseLoader import BaseLoader

import numpy as np
import pandas as pd


class CelegansLoader(BaseLoader):
    def __init__(self):
        super().__init__()
        self.type = "celegans"
        # self._load_raw_data()
        self._load_data()

    def _load_data(self):

        base_path = os.path.dirname(os.path.abspath(__file__))
        self._data = np.load(os.path.join(base_path, "celegans_data.npy"))
        self._label = np.load(os.path.join(base_path, "celegans_label.npy"))
        self._precomputed_knn = (
            (
                np.load(os.path.join(base_path, "knn_indices.npy")),
                np.load(os.path.join(base_path, "knn_dists.npy")),
            )
            if os.path.exists(os.path.join(base_path, "knn_indices.npy"))
            and os.path.exists(os.path.join(base_path, "knn_dists.npy"))
            else (None, None)
        )

        self._legend = [
            "ASE, ASJ, AUA",
            "ASH",
            "AWC",
            "ADL",
            "ASG, AWA",
            "ASK",
            "ASI",
            "AFD",
            "ADF, AWB",
            "Not annotated",
        ]

    def _load_raw_data(self):
        base_path = os.path.dirname(os.path.abspath(__file__))
        preprocessed_path = os.path.join(base_path, "celegans_proccessed.csv")
        metadata_path = os.path.join(base_path, "celegans_metadata.csv")

        df = pd.read_csv(preprocessed_path, index_col=0)
        df2 = pd.read_csv(metadata_path, index_col=0)
        cell_types = df2["cell_type"]
        cell_types = cell_types.fillna("")

        ctype_to_lineage = {
            "": "Not annotated",
            ##
            "Neuroblast_ASE_ASJ_AUA": "ASE, ASJ, AUA",
            "Neuroblast_ASJ_AUA": "ASE, ASJ, AUA",
            "ASE_parent": "ASE, ASJ, AUA",
            "ASE": "ASE, ASJ, AUA",
            "ASEL": "ASE, ASJ, AUA",
            "ASER": "ASE, ASJ, AUA",
            "ASJ": "ASE, ASJ, AUA",
            "AUA": "ASE, ASJ, AUA",
            ##
            "Neuroblast_ASG_AWA": "ASG, AWA",
            "ASG_AWA": "ASG, AWA",
            "ASG": "ASG, AWA",
            "AWA": "ASG, AWA",
            ##
            "Neuroblast_ADF_AWB": "ADF, AWB",
            "ADF_AWB": "ADF, AWB",
            "ADF": "ADF, AWB",
            "AWB": "ADF, AWB",
            ##
            "AWC": "AWC",
            "AWC_ON": "AWC",
            ##
            "Neuroblast_AFD_RMD": "AFD",
            "AFD": "AFD",
            ##
            "ADL_parent": "ADL",
            "ADL": "ADL",
            ##
            "ASH": "ASH",
            ##
            "ASI_parent": "ASI",
            "ASI": "ASI",
            ##
            "ASK_parent": "ASK",
            "ASK": "ASK",
        }

        self._data = np.array(df)
        self._label = np.array([ctype_to_lineage[celltype] for celltype in cell_types])
        self._legend = [
            "ASE, ASJ, AUA",
            "ASH",
            "AWC",
            "ADL",
            "ASG, AWA",
            "ASK",
            "ASI",
            "AFD",
            "ADF, AWB",
            "Not annotated",
        ]
        self._precomputed_knn = (
            (
                np.load(f"./{self.type}/knn_dists.npy"),
                np.load(f"./{self.type}/knn_indices.npy"),
            )
            if os.path.exists(f"./{self.type}/knn_dists.npy")
            and os.path.exists(f"./{self.type}/knn_indices.npy")
            else (None, None)
        )

        np.save(os.path.join(base_path, "celegans_data.npy"), self._data)
        np.save(os.path.join(base_path, "celegans_label.npy"), self._label)

    def get_data(self):
        return super().get_data()
