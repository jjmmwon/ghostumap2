from dataclasses import dataclass
from typing import TypedDict

import numpy as np


class TPoint(TypedDict):
    x: float
    y: float
    r: float


@dataclass
class GhostPointModel:
    id: int
    points: list[TPoint]
    label: str | None

    def to_dict(self):
        return {
            "id": self.id,
            "coords": self.points,
            "label": self.label,
        }


class GhostEmbedding:
    @staticmethod
    def build_model(
        ghost_embedding: np.ndarray,  # shape (n_points, n_ghosts, 2)
        init_radii: np.ndarray,  # shape (n_points, n_ghosts)
        label: np.ndarray | list[str] | None,  # shape (n_points,)
    ) -> list[dict]:
        if label is None:
            label = [None] * len(ghost_embedding)

        return [
            GhostPointModel(
                id=i,
                points=[{"x": x, "y": y, "r": r} for (x, y), r in zip(g, r)],
                label=str(l),
            ).to_dict()
            for i, (g, r, l) in enumerate(zip(ghost_embedding, init_radii, label))
        ]

        # return [
        #     GhostPointModel(
        #         id=i, coords=[{"x": x, "y": y} for x, y in g], label=str(l)
        #     ).to_dict()
        #     for i, (g, l) in enumerate(zip(ghost_embedding, label))
        # ]
