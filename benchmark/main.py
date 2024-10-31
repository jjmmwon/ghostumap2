import logging

import numpy as np

from benchmark.hyperparameters import generate_hyperparameter_comb
from benchmark.runner import run_GhostUMAP, measure_accuracy
from benchmark.save_manager import save_embeddings, save_results
from rdumap.data import DataLoader

logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)


def main(data_name: str, base_settings: dict, param_grid: dict, iterations: int = 1):
    # Load dataset

    logging.info(f"Loading dataset: {data_name}")
    dl = DataLoader(data_name)

    X, y, legend, precomputed_knn = dl.get_data().values()

    logging.info("Generating hyperparameter combinations.")
    hpram_comb = generate_hyperparameter_comb(base_settings, param_grid)

    for hprams in hpram_comb:
        if hprams["ghost_gen"] >= hprams["init_dropping"]:
            logging.info(
                f"Skipping combination due to {hprams['ghost_gen']} >= {hprams['init_dropping']}"
            )
            continue

        results = []
        logging.info(f"Running benchmark for parameter set: {hprams}")

        for i in range(iterations):
            logging.info(f"Starting iteration {i + 1}/{iterations}.")
            result_acc = run_GhostUMAP(
                X,
                hprams,
                bm_type="accuracy",
                precomputed_knn=precomputed_knn,
                distance=0.1,
            )
            save_embeddings(result_acc, hprams, "accuracy", data_name)

            result_twd = run_GhostUMAP(
                X, hprams, bm_type="time_with_dropping", precomputed_knn=precomputed_knn
            )
            save_embeddings(result_twd, hprams, "time_with_dropping", data_name)

            result_twod = run_GhostUMAP(
                X,
                hprams,
                bm_type="time_without_dropping",
                precomputed_knn=precomputed_knn,
            )
            save_embeddings(result_twod, hprams, "time_without_dropping", data_name)

            f1, precision, recall = measure_accuracy(
                result_acc["unstable_ghosts"], result_acc["alive_ghosts"]
            )
            time_with_dropping = result_twd["opt_time"]
            time_without_dropping = result_twod["opt_time"]

            result = {
                "data": data_name,
                **hprams,
                "iter": i,
                "f1": f1,
                "precision": precision,
                "recall": recall,
                "num_unstable_ghosts": np.sum(result_acc["unstable_ghosts"]),
                "num_remaining_ghosts": np.sum(result_acc["alive_ghosts"]),
                "common_ghosts": np.sum(
                    np.logical_and(
                        result_acc["unstable_ghosts"], result_acc["alive_ghosts"]
                    )
                ),
                "time_with_dropping": time_with_dropping,
                "time_without_dropping": time_without_dropping,
            }

            results.append(result)

        save_results(data_name, results)
        logging.info("Results saved for current parameter set.")
        results = []


if __name__ == "__main__":
    data_name = ["celegans", "mnist", "fmnist", "kmnist"]

    base_settings = {
        "n_ghosts": 16,
        "radii": 0.1,
        "sensitivity": 0.9,
        "mov_avg_weight": 0.9,
    }
    param_grid = {
        # "ghost_gen": [0, 0.1, 0.2, 0.3],
        "ghost_gen": [0.1, 0.2],
        # "init_dropping": [0.3, 0.4, 0.5, 0.6],
        "init_dropping": [0.5, 0.6],
    }

    for data in data_name[:1]:
        logging.info(f"Starting benchmark for dataset: {data}")
        main(data, base_settings, param_grid)
        logging.info(f"Completed benchmark for dataset: {data}")
