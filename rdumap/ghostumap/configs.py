from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass(frozen=True)
class Config:
    ghost_init: float = field(default=0.1)
    init_epoch: int = field(default=50)
    distance: float = field(default=0.005)
    distance_list: list = field(default_factory=list)


# Lazy initialization of config
_config: Optional[Config] = None


def get_config() -> Config:
    global _config
    if _config is None:
        raise ValueError("Config not set")
    return _config


def set_config(ghost_init, init_epoch, distance) -> None:
    global _config
    # if _config:
    #     raise ValueError("Config already exists")

    _config = Config(ghost_init=ghost_init, init_epoch=init_epoch, distance=distance)


def add_distance(distance) -> None:
    global _config
    _config.distance_list.append(distance)


__all__ = ["get_config"]
