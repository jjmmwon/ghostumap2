from datetime import datetime
import os
from typing import Dict, List

import numpy as np
import pandas as pd

from .hyperparameters import make_dir_name
from .models import THyperparameter, TResult, Tbenchmark


def save_embeddings(
    result: TResult,
    hyperparameters: THyperparameter,
    bm_type: Tbenchmark,
    data_name: str,
    results_dir: str = "results",
):
    if not os.path.isdir(results_dir):
        os.makedirs(results_dir)

    base_path = os.path.join(results_dir, data_name)

    if not os.path.isdir(base_path):
        os.makedirs(base_path)

    dir_name = make_dir_name(hyperparameters)
    hpram_path = os.path.join(base_path, dir_name)

    if not os.path.isdir(hpram_path):
        os.makedirs(hpram_path)

    eval_path = os.path.join(hpram_path, bm_type)

    if not os.path.isdir(eval_path):
        os.makedirs(eval_path)

    cnt = len(os.listdir(eval_path)) + 1

    result = {key: val for key, val in result.items() if key != "opt_time"}

    np.savez_compressed(f"{eval_path}/{cnt}.npz", **result)

    return


def save_results(
    data_name: str,
    results: List[Dict],
    results_dir: str = "results",
):
    df = pd.DataFrame(results)

    if not os.path.isdir(results_dir):
        os.makedirs(results_dir)

    if not os.path.isdir(f"{results_dir}/{data_name}"):
        os.makedirs(f"{results_dir}/{data_name}")

    if not os.path.exists(f"{results_dir}/result.csv"):
        df.to_csv(f"{results_dir}/result.csv", index=False)
    else:
        overall_df_old = pd.read_csv(f"{results_dir}/result.csv")
        overall_df = pd.concat([overall_df_old, df], ignore_index=True)
        overall_df.to_csv(f"{results_dir}/result.csv", index=False)

    if not os.path.exists(f"{results_dir}/{data_name}/result.csv"):
        df.to_csv(f"{results_dir}/{data_name}/result.csv", index=False)

    else:
        individual_df_old = pd.read_csv(f"{results_dir}/{data_name}/result.csv")
        individual_df = pd.concat([individual_df_old, df], ignore_index=True)
        individual_df.to_csv(f"{results_dir}/{data_name}/result.csv", index=False)
