from dataclasses import dataclass
from typing import TypedDict


class TPosition(TypedDict):
    x: float
    y: float


@dataclass
class OriginalPointModel:
    id: int
    x: float
    y: float
    radii: list[float]
    label: str | None
    neighbors: list[int]

    def to_dict(self):
        return {
            "id": self.id,
            "x": self.x,
            "y": self.y,
            "radii": self.radii,
            "label": self.label,
            "neighbors": self.neighbors,
        }


@dataclass
class GhostPointModel:
    id: int
    positions: list[TPosition]
    label: str | None

    def to_dict(self):
        return {
            "id": self.id,
            "positions": self.positions,
            "label": self.label,
        }


__all__ = ["OriginalPointModel", "GhostPointModel"]
