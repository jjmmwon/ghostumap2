from dataclasses import dataclass
from typing import List, Dict, Any
import numpy as np
from .OriginalEmbedding import OriginalEmbedding
from .GhostEmbedding import GhostEmbedding


class EmbeddingSet:
    def __init__(
        self,
        original_embedding: np.ndarray,
        ghost_embedding: np.ndarray,
        neighbors: np.ndarray,
        r: float,
        init_radii: np.ndarray,
        label: np.ndarray | list | None,
        title: str,
        legend: List[str] | None,
        colors: Dict[str, str] | None = None,
    ):
        self.original_embedding = original_embedding
        self.ghost_embedding = ghost_embedding
        self.neighbors = neighbors
        self.r = r
        self.init_radii = init_radii

        self.label = label
        self.title = title
        self.legend = legend
        self.colors = colors
        self.n_ghosts = ghost_embedding.shape[1]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "original_embedding": OriginalEmbedding.build_model(
                self.original_embedding,
                self.ghost_embedding,
                self.neighbors,
                self.label,
            ),
            "ghost_embedding": GhostEmbedding.build_model(
                self.ghost_embedding, self.init_radii, self.label
            ),
            "r": self.r,
            "title": self.title,
            "legend": self.legend or self.generate_default_legend(self.label),
            "colors": self.colors or {},
            "n_ghosts": self.n_ghosts,
        }

    @staticmethod
    def generate_default_legend(label: np.ndarray | list | None) -> List[str]:
        if label is None:
            return []

        return [str(l) for l in sorted(set(label))]
