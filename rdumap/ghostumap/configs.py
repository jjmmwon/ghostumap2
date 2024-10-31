from dataclasses import dataclass, field, asdict
from typing import Literal, Optional


Tbenchmark = Literal["None", "accuracy", "time_with_dropping", "time_without_dropping"]


@dataclass(frozen=True)
class Config:
    radii: float = field(default=0.1)
    sensitivity: float = field(default=0.9)
    ghost_gen: float = field(default=0.25)
    init_dropping: float = field(default=0.5)
    mov_avg_weight: float = field(default=0.9)
    bm_type: Tbenchmark = field(default="None")


_config: Optional[Config] = None


def get_config() -> Config:
    global _config
    if _config is None:
        raise ValueError("Config not set")
    return _config


def set_config(
    radii,
    sensitivity,
    ghost_gen,
    init_dropping,
    mov_avg_weight=0.9,
    bm_type: Tbenchmark = "None",
) -> None:
    global _config
    # if _config:
    #     raise ValueError("Config already exists")

    _config = Config(
        radii=radii,
        sensitivity=sensitivity,
        ghost_gen=ghost_gen,
        init_dropping=init_dropping,
        mov_avg_weight=mov_avg_weight,
        bm_type=bm_type,
    )


__all__ = ["get_config", "set_config"]
