import importlib.metadata
import pathlib
from typing import List, TypedDict

import anywidget
import traitlets
import numpy as np
import os

from .model import EmbeddingSet


class EmbeddingSetInput(TypedDict):
    original_embedding: np.ndarray
    ghost_embedding: np.ndarray
    neighbors: np.ndarray | list[list[int]]
    title: str | None
    legend: list[str] | None
    colors: dict[str, str] | None


try:
    __version__ = importlib.metadata.version("ghostumap")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Widget(anywidget.AnyWidget):
    _esm = (
        pathlib.Path(__file__).parent / "static" / "widget.js"
        if not os.getenv("ANYWIDGET_HMR")
        else "http://localhost:5173/widget/widget.ts?anywidget"
    )
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    width = traitlets.Int(300).tag(sync=True)
    height = traitlets.Int(300).tag(sync=True)
    legend_width = traitlets.Int(150).tag(sync=True)
    legend_height = traitlets.Int(300).tag(sync=True)
    histogram_width = traitlets.Int(300).tag(sync=True)
    histogram_height = traitlets.Int(300).tag(sync=True)

    embedding_set: list[EmbeddingSet] = traitlets.List([]).tag(sync=True)

    distance = traitlets.Float(0.1).tag(sync=True)
    sensitivity = traitlets.Float(0.9).tag(sync=True)
    show_neighbors = traitlets.Bool(True).tag(sync=True)
    show_ghosts = traitlets.Bool(True).tag(sync=True)
    show_unstables = traitlets.Bool(True).tag(sync=True)
    embedding_id = traitlets.Int(0).tag(sync=True)

    def __init__(
        self,
        embedding_set: list[EmbeddingSetInput] | EmbeddingSetInput | None = None,
        original_embedding: np.ndarray = None,
        ghost_embedding: np.ndarray = None,
        neighbors: np.ndarray = None,
        label: np.ndarray | list[str] = None,
        title: str = None,
        legend: list[str] = None,
        sensitivity: float = 0.9,
        distance: float = 0.1,
        width: int = 500,
        height: int = 500,
        legend_width: int = 250,
        legend_height: int = 500,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)

        self.width = width
        self.height = height
        self.legend_width = legend_width
        self.legend_height = legend_height

        self.sensitivity = sensitivity
        self.distance = distance

        self.embedding_set = self._process_embedding(
            embedding=embedding_set,
            original_embedding=original_embedding,
            ghost_embedding=ghost_embedding,
            neighbors=neighbors,
            label=label,
            title=title,
            legend=legend,
        )

    def add_embedding(
        self,
        embedding: list[EmbeddingSetInput] | EmbeddingSetInput | None = None,
        original_embedding: np.ndarray = None,
        ghost_embedding: np.ndarray = None,
        neighbors: np.ndarray = None,
        label: np.ndarray | list[str] = None,
        title: str = None,
        legend: list[str] = None,
    ):
        self.embedding_set.append(
            self._process_embedding(
                embedding=embedding,
                original_embedding=original_embedding,
                ghost_embedding=ghost_embedding,
                neighbors=neighbors,
                label=label,
                title=title,
                legend=legend,
            )
        )

    def _process_embedding(
        self,
        embedding: list[EmbeddingSetInput] | EmbeddingSetInput | None = None,
        original_embedding: np.ndarray | None = None,
        ghost_embedding: np.ndarray | None = None,
        neighbors: np.ndarray | list[list[int]] | None = None,
        label: np.ndarray | list[str] | None = None,
        title: str | None = None,
        legend: list[str] | None = None,
        colors: dict[str, str] | None = None,
    ):
        if isinstance(embedding, dict):
            return [
                EmbeddingSet(
                    original_embedding=embedding["original_embedding"],
                    ghost_embedding=embedding["ghost_embedding"],
                    neighbors=embedding["neighbors"],
                    label=embedding.get("label"),
                    title=embedding.get("title"),
                    legend=embedding.get("legend"),
                    colors=embedding.get("colors"),
                ).to_dict()
            ]

        elif isinstance(embedding, list):
            return [
                EmbeddingSet(
                    original_embedding=emb["original_embedding"],
                    ghost_embedding=emb["ghost_embedding"],
                    neighbors=emb["neighbors"],
                    label=emb.get("label"),
                    title=emb.get("title"),
                    legend=emb.get("legend"),
                    colors=emb.get("colors"),
                ).to_dict()
                for emb in embedding
            ]

        elif (
            original_embedding is not None
            and ghost_embedding is not None
            and neighbors is not None
        ):
            return [
                EmbeddingSet(
                    original_embedding=original_embedding,
                    ghost_embedding=ghost_embedding,
                    neighbors=neighbors,
                    label=label,
                    title=title,
                    legend=legend,
                    colors=colors,
                ).to_dict()
            ]

        else:
            raise ValueError(
                "Either 'embedding' or 'original_embedding' and 'ghost_embedding' must be provided"
            )

    def update_params(
        self,
        **kwargs,
    ):
        """
        Update widget parameters based on provided keyword arguments.

        Parameters:
        - sensitivity: float
        - distance: float
        - show_neighbors: bool
        - show_ghosts: bool
        - width: int
        - height: int
        - legend_width: int
        - legend_height: int

        Any parameter not provided will retain its current value.
        """

        valid_params = {
            "sensitivity",
            "distance",
            "show_neighbors",
            "show_ghosts",
            "width",
            "height",
            "legend_width",
            "legend_height",
        }

        invalid_params = set(kwargs.keys()) - valid_params

        if invalid_params:
            raise ValueError(f"Invalid parameter(s): {', '.join(invalid_params)}")

        for key, value in kwargs.items():
            if value is None:
                raise ValueError(f"Parameter '{key}' cannot be None")
            setattr(self, key, value)

    def _repr_html_(self):
        """IPython display representation"""
        mimebundle = self._repr_mimebundle_()
        if "text/html" in mimebundle[0]:
            return mimebundle[0]["text/html"]
        else:
            return repr(self)
