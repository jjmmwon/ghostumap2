from dataclasses import dataclass, field, asdict, replace
from typing import Optional

import numpy as np


@dataclass(frozen=True)
class Result:
    opt_time: float = field(default=0.0)
    distance_list: np.ndarray = field(default_factory=lambda: np.array([]))
    threshold_list: np.ndarray = field(default_factory=lambda: np.array([]))
    init_radii: np.ndarray = field(default_factory=lambda: np.array([]))


# Lazy initialization of config
_result: Optional[Result] = Result()


def get_results() -> Result:
    global _result
    if _result is None:
        raise ValueError(
            "Result not set. Please set the results using `set_results` or `set_eval_results`."
        )
    return _result


def set_results(
    opt_time=None,
    distance_list=None,
    threshold_list=None,
    init_radii=None,
    reinit: bool = False,
) -> None:
    global _result

    if reinit:
        _result = Result()
        return

    _result = replace(
        _result,
        opt_time=opt_time if opt_time is not None else _result.opt_time,
        distance_list=(
            distance_list if distance_list is not None else _result.distance_list
        ),
        threshold_list=(
            threshold_list if threshold_list is not None else _result.threshold_list
        ),
        init_radii=(init_radii if init_radii is not None else _result.init_radii),
    )


__all__ = [
    "get_results",
    "set_results",
]
