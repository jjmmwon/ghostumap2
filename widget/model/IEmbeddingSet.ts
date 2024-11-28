import type IGhostPoint from "./IGhostPoint";
import type IOriginalPoint from "./IOriginalPoint";

interface IEmbeddingSet {
  original_embedding: IOriginalPoint[];
  ghost_embedding: IGhostPoint[];
  n_ghosts: number;
  r: number;
  title: string;
  legend: string[];
  colors: { [key: string]: string } | {};
}

export default IEmbeddingSet;
