import itertools


def generate_hyperparameter_comb(
    base_settings: dict,
    param_grid: dict,
):
    """
    Generate hyperparameter combinations for grid search.
    """
    param_combinations = list(itertools.product(*param_grid.values()))
    keys = param_grid.keys()

    combined_settings = []
    for values in param_combinations:
        settings = base_settings.copy()
        settings.update(dict(zip(keys, values)))
        combined_settings.append(settings)

    return combined_settings


def make_dir_name(hyperparameters):
    hpram_keys = [
        "n_ghosts",
        "radii",
        "sensitivity",
        "ghost_gen",
        "init_dropping",
        "mov_avg_weight",
    ]
    hpram_abbr = ["ng", "r", "sens", "gg", "init", "mov"]

    dir_name = "_".join(
        [
            f"{abbr}_{val}"
            for abbr, val in zip(
                hpram_abbr, [hyperparameters[key] for key in hpram_keys]
            )
        ]
    )

    return dir_name


__all__ = ["generate_hyperparameter_comb", "make_dir_name"]
