import importlib.metadata
import pathlib

import anywidget
import traitlets
import numpy as np

from .model import OriginalPointModel, GhostPointModel

try:
    __version__ = importlib.metadata.version("stab")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Widget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    width = traitlets.Int(300).tag(sync=True)
    height = traitlets.Int(300).tag(sync=True)

    original_embedding = traitlets.List([]).tag(sync=True)
    ghost_embedding = traitlets.List([]).tag(sync=True)
    n_ghosts = traitlets.Int(0).tag(sync=True)
    distance = traitlets.Float(0.1).tag(sync=True)
    sensitivity = traitlets.Float(0.9).tag(sync=True)

    def __init__(
        self,
        original_embedding: np.ndarray,
        ghost_embedding: np.ndarray,
        neighbors: np.ndarray,
        radii: np.ndarray,
        label: np.ndarray | None = None,
        sensitivity=0.9,
        distance=0.1,
        width: int = 500,
        height: int = 500,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)

        self.width = width
        self.height = height

        self.sensitivity = sensitivity
        self.distance = distance

        self.fit_types(original_embedding, ghost_embedding, neighbors, radii, label)

    def fit_types(
        self,
        original_embedding: np.ndarray,
        ghost_embedding: np.ndarray,
        neighbors: np.ndarray,
        radii: np.ndarray,
        label: np.ndarray | None,
    ):
        label = label if label is not None else [None] * len(original_embedding)
        self.original_embedding = [
            OriginalPointModel(
                id=i, x=x, y=y, radii=r.tolist(), label=str(l), neighbors=n.tolist()
            ).to_dict()
            for i, (x, y, r, l, n) in enumerate(
                zip(
                    original_embedding[:, 0],
                    original_embedding[:, 1],
                    radii,
                    label,
                    neighbors,
                )
            )
        ]

        self.ghost_embedding = [
            GhostPointModel(
                id=i,
                positions=[{"x": x, "y": y} for x, y in g],
                label=str(l),
            ).to_dict()
            for i, (g, l) in enumerate(zip(ghost_embedding, label))
        ]

        self.n_ghosts = ghost_embedding.shape[1]
