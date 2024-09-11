from dataclasses import dataclass
from typing import TypedDict

import numpy as np


class TPosition(TypedDict):
    x: float
    y: float


@dataclass
class GhostPointModel:
    id: int
    coords: list[TPosition]
    label: str | None

    def to_dict(self):
        return {
            "id": self.id,
            "coords": self.coords,
            "label": self.label,
        }


class GhostEmbedding:
    @staticmethod
    def build_model(
        ghost_embedding: np.ndarray, label: np.ndarray | list[str] | None
    ) -> list[dict]:
        if label is None:
            label = [None] * len(ghost_embedding)

        return [
            GhostPointModel(
                id=i, coords=[{"x": x, "y": y} for x, y in g], label=str(l)
            ).to_dict()
            for i, (g, l) in enumerate(zip(ghost_embedding, label))
        ]
