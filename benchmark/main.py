import logging

from benchmark.runner import benchmark_v0, benchmark_v1
from benchmark.hyperparameters import generate_hyperparameter_comb
from benchmark.utils import run_GhostUMAP, measure_accuracy
from benchmark.save_manager import save_embeddings, save_results
from rdumap.data import DataLoader


def main(
    data_name: str,
    base_settings: dict,
    param_grid: dict,
    iterations: int = 3,
    version="v1",
):
    # Load dataset
    print(version)

    logging.info(f"Loading dataset: {data_name}")
    dl = DataLoader(data_name)
    X, y, legend, precomputed_knn = dl.get_data().values()

    logging.info("Generating hyperparameter combinations.")
    hpram_comb = generate_hyperparameter_comb(base_settings, param_grid)

    benchmark_func = benchmark_v0 if version == "v0" else benchmark_v1

    for hprams in hpram_comb:
        if hprams["ghost_gen"] >= hprams["init_dropping"]:
            logging.info(
                f"Skipping combination due to {hprams['ghost_gen']} >= {hprams['init_dropping']}"
            )
            continue

        logging.info(f"Running benchmark for parameter set: {hprams}")

        results = benchmark_func(
            data_name,
            X,
            precomputed_knn,
            hprams,
            iterations,
        )

        save_results(data_name, results, results_dir=f"results_{version}")
        logging.info("Results saved for current parameter set.")


if __name__ == "__main__":
    logging.basicConfig(
        filename="benchmark.log",
        format="%(levelname)s: %(message)s",
        level=logging.INFO,
        filemode="a",
    )

    data_name = ["celegans", "mnist", "fmnist", "kmnist"]
    # data_name = ["celegans"]

    base_settings = {
        "radii": 0.1,
        "sensitivity": 0.9,
        "mov_avg_weight": 0.9,
        "ghost_gen": 0.2,
        "init_dropping": 0.4,
    }
    param_grid = {
        "n_ghosts": [8, 16, 32],
        # "n_ghosts": [8],
    }
    print(data_name)

    for data in data_name:
        logging.info(f"Starting benchmark for dataset: {data}")
        main(data, base_settings, param_grid, iterations=3, version="v1")
        logging.info(f"Completed benchmark for dataset: {data}")
