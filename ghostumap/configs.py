from dataclasses import dataclass, field, asdict
from typing import Literal, Optional


Tbenchmark = Literal[
    "None",
    "accuracy_dropping",
    "time_with_dropping",
    "accuracy_SH",
    "time_with_SH",
    "time_original_GU",
    "original_UMAP",
]


@dataclass(frozen=True)
class Config:
    r: float = field(default=0.1)
    sensitivity: float = field(default=1)
    ghost_gen: float = field(default=0.25)
    dropping: bool = field(default=True)
    init_dropping: float = field(default=0.5)
    smoothing_factor: float = field(default=0.9)
    bm_type: Tbenchmark = field(default="None")


_config: Optional[Config] = None


def get_config() -> Config:
    global _config
    if _config is None:
        raise ValueError("Config not set")
    return _config


def set_config(
    r,
    sensitivity,
    ghost_gen=0.2,
    dropping=True,
    init_dropping=0.4,
    smoothing_factor=0.9,
    bm_type: Tbenchmark = "None",
) -> None:
    global _config
    # if _config:
    #     raise ValueError("Config already exists")

    _config = Config(
        r=r,
        sensitivity=sensitivity,
        ghost_gen=ghost_gen,
        dropping=dropping,
        init_dropping=init_dropping,
        smoothing_factor=smoothing_factor,
        bm_type=bm_type,
    )


__all__ = ["get_config", "set_config"]
