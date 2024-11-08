import logging

import numpy as np

from benchmark.hyperparameters import generate_hyperparameter_comb
from benchmark.utils import run_GhostUMAP, measure_accuracy
from benchmark.save_manager import save_embeddings, save_results
from rdumap.data import DataLoader
from rdumap.ghostumap.utils import drop_ghosts


def benchmark_v0(
    data_name: str,
    X: np.ndarray,
    precomputed_knn,
    hyperparameters,
    iterations=10,
    # data_name: str, base_settings: dict, param_grid: dict, iterations: int = 10
):
    """
    Testing the best hyperparameter combinations for ghost_gen and init_dropping
    """

    # Load dataset

    results = []

    for i in range(iterations):
        logging.info(f"Starting iteration {i + 1}/{iterations}.")
        result_acc = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="accuracy",
            precomputed_knn=precomputed_knn,
            distance=0.1,
        )
        save_embeddings(result_acc, hyperparameters, "accuracy", data_name)

        result_twd = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_with_dropping",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(result_twd, hyperparameters, "time_with_dropping", data_name)

        result_twod = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_without_dropping",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_twod, hyperparameters, "time_without_dropping", data_name
        )

        f1, precision, recall = measure_accuracy(
            result_acc["unstable_ghosts"], result_acc["alive_ghosts"]
        )
        time_with_dropping = result_twd["opt_time"]
        time_without_dropping = result_twod["opt_time"]

        result = {
            "data": data_name,
            **hyperparameters,
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

    return results


def benchmark_v1(
    data_name: str,
    X: np.ndarray,
    precomputed_knn,
    hyperparameters,
    iterations=10,
):
    results = []

    for i in range(iterations):
        logging.info(f"Starting iteration {i + 1}/{iterations}.")
        result_acc_dropping = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="accuracy_dropping",
            precomputed_knn=precomputed_knn,
            distance=0.1,
        )
        save_embeddings(
            result_acc_dropping,
            hyperparameters,
            "accuracy_dropping",
            data_name,
            results_dir="results_v1",
        )

        result_acc_sh = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="accuracy_SH",
            precomputed_knn=precomputed_knn,
            distance=0.1,
        )
        save_embeddings(
            result_acc_sh,
            hyperparameters,
            "accuracy_dropping",
            data_name,
            results_dir="results_v1",
        )

        result_twd = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_with_dropping",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_twd,
            hyperparameters,
            "time_with_dropping",
            data_name,
            results_dir="results_v1",
        )

        result_twsh = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_with_SH",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_twd,
            hyperparameters,
            "time_with_SH",
            data_name,
            results_dir="results_v1",
        )

        result_time_orig = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_original_GU",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_time_orig,
            hyperparameters,
            "time_without_dropping",
            data_name,
            results_dir="results_v1",
        )

        true_drop = result_acc_dropping["unstable_ghosts"]
        pred_drop = drop_ghosts(
            result_acc_dropping["original_embedding"],
            result_acc_dropping["ghost_embedding"],
            result_acc_dropping["alive_ghosts"],
            sensitivity=hyperparameters["sensitivity"],
            distance=0.1,
        )

        f1_drop, precision_drop, recall_drop = measure_accuracy(true_drop, pred_drop)

        true_sh = result_acc_sh["unstable_ghosts"]
        pred_sh = drop_ghosts(
            result_acc_sh["original_embedding"],
            result_acc_sh["ghost_embedding"],
            result_acc_sh["alive_ghosts"],
            sensitivity=hyperparameters["sensitivity"],
            distance=0.1,
        )
        f1_sh, precision_sh, recall_sh = measure_accuracy(true_sh, pred_sh)

        print(f1_drop, precision_drop, recall_drop, f1_sh, precision_sh, recall_sh)
        time_with_dropping = result_twd["opt_time"]
        time_with_SH = result_twsh["opt_time"]
        time_GU = result_time_orig["opt_time"]

        result = {
            "data": data_name,
            **hyperparameters,
            "iter": i,
            "time_original_GU": time_GU,
            "time_with_dropping": time_with_dropping,
            "time_with_SH": time_with_SH,
            "f1_dropping": f1_drop,
            "precision_dropping": precision_drop,
            "recall_dropping": recall_drop,
            "f1_SH": f1_sh,
            "precision_SH": precision_sh,
            "recall_SH": recall_sh,
            "num_unstable_ghosts_dropping": np.sum(true_drop),
            "num_remaining_ghosts_dropping": np.sum(
                result_acc_dropping["alive_ghosts"]
            ),
            "num_unstable_ghosts_after_dropping": np.sum(pred_drop),
            "common_ghosts_dropping": np.sum(np.logical_and(true_drop, pred_drop)),
            "num_unstable_ghosts_SH": np.sum(true_sh),
            "num_remaining_ghosts_SH": np.sum(result_acc_sh["alive_ghosts"]),
            "num_unstable_ghosts_after_SH": np.sum(pred_sh),
            "common_ghosts_SH": np.sum(np.logical_and(true_sh, pred_sh)),
        }

        results.append(result)

    return results


def benchmark_v2(
    data_name: str,
    X: np.ndarray,
    precomputed_knn,
    hyperparameters,
    iterations=3,
):
    """
    Adding original UMAP and time comparison
    """
    results = []

    for i in range(iterations):
        logging.info(f"Starting iteration {i + 1}/{iterations}.")
        result_acc_dropping = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="accuracy_dropping",
            precomputed_knn=precomputed_knn,
            distance=0.1,
        )
        save_embeddings(
            result_acc_dropping,
            hyperparameters,
            "accuracy_dropping",
            data_name,
            results_dir="results_v2",
        )

        result_acc_sh = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="accuracy_SH",
            precomputed_knn=precomputed_knn,
            distance=0.1,
        )
        save_embeddings(
            result_acc_sh,
            hyperparameters,
            "accuracy_dropping",
            data_name,
            results_dir="results_v2",
        )

        result_twd = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_with_dropping",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_twd,
            hyperparameters,
            "time_with_dropping",
            data_name,
            results_dir="results_v2",
        )

        result_twsh = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_with_SH",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_twd,
            hyperparameters,
            "time_with_SH",
            data_name,
            results_dir="results_v2",
        )

        result_time_orig = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="time_original_GU",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_time_orig,
            hyperparameters,
            "time_without_dropping",
            data_name,
            results_dir="results_v2",
        )

        result_time_original_UMAP = run_GhostUMAP(
            X,
            hyperparameters,
            bm_type="original_UMAP",
            precomputed_knn=precomputed_knn,
        )
        save_embeddings(
            result_time_original_UMAP,
            hyperparameters,
            "original_UMAP",
            data_name,
            results_dir="results_v2",
        )

        true_drop = result_acc_dropping["unstable_ghosts"]
        pred_drop = drop_ghosts(
            result_acc_dropping["original_embedding"],
            result_acc_dropping["ghost_embedding"],
            result_acc_dropping["alive_ghosts"],
            sensitivity=hyperparameters["sensitivity"],
            distance=0.1,
        )

        f1_drop, precision_drop, recall_drop = measure_accuracy(true_drop, pred_drop)

        true_sh = result_acc_sh["unstable_ghosts"]
        pred_sh = drop_ghosts(
            result_acc_sh["original_embedding"],
            result_acc_sh["ghost_embedding"],
            result_acc_sh["alive_ghosts"],
            sensitivity=hyperparameters["sensitivity"],
            distance=0.1,
        )
        f1_sh, precision_sh, recall_sh = measure_accuracy(true_sh, pred_sh)

        print(f1_drop, precision_drop, recall_drop, f1_sh, precision_sh, recall_sh)
        time_with_dropping = result_twd["opt_time"]
        time_with_SH = result_twsh["opt_time"]
        time_GU = result_time_orig["opt_time"]
        time_UMAP = result_time_original_UMAP["opt_time"]

        result = {
            "data": data_name,
            **hyperparameters,
            "iter": i,
            "time_UMAP": time_UMAP,
            "time_original_GU": time_GU,
            "time_with_dropping": time_with_dropping,
            "time_with_SH": time_with_SH,
            "f1_dropping": f1_drop,
            "precision_dropping": precision_drop,
            "recall_dropping": recall_drop,
            "f1_SH": f1_sh,
            "precision_SH": precision_sh,
            "recall_SH": recall_sh,
            "num_unstable_ghosts_dropping": np.sum(true_drop),
            "num_remaining_ghosts_dropping": np.sum(
                result_acc_dropping["alive_ghosts"]
            ),
            "num_unstable_ghosts_after_dropping": np.sum(pred_drop),
            "common_ghosts_dropping": np.sum(np.logical_and(true_drop, pred_drop)),
            "num_unstable_ghosts_SH": np.sum(true_sh),
            "num_remaining_ghosts_SH": np.sum(result_acc_sh["alive_ghosts"]),
            "num_unstable_ghosts_after_SH": np.sum(pred_sh),
            "common_ghosts_SH": np.sum(np.logical_and(true_sh, pred_sh)),
        }

        results.append(result)

    return results


__all__ = ["benchmark_v0", "benchmark_v1", "benchmark_v2"]
