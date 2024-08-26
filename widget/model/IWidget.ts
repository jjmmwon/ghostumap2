import type IEmbeddingSet from "./IEmbeddingSet";
import type IUnstableInfo from "./IUnstableInfo";

interface IWidget {
  embedding_set: IEmbeddingSet[];

  width: number;
  height: number;
  legend_width: number;
  legend_height: number;
  histogram_width: number;
  histogram_height: number;

  embedding_id: number;

  distance: number;
  sensitivity: number;

  show_unstables: boolean;
  show_neighbors: boolean;
  show_ghosts: boolean;

  unstableInfo: IUnstableInfo;
  checkedUnstables: number[];
}

export default IWidget;
