interface IOriginalPoint {
  id: number;
  x: number;
  y: number;
  radii: number[];
  label: number | string | null;
  neighbors: number[];
}

interface IPosition {
  x: number;
  y: number;
}

interface IGhostPoint {
  id: number;
  positions: IPosition[];
  label: number | string | null;
}

interface IScales {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  colorScale: d3.ScaleOrdinal<string, string, never>;
  scaledDist: number;
}

interface IWidgetModel {
  original_embedding: IOriginalPoint[];
  ghost_embedding: IGhostPoint[];
  n_ghosts: number;
  distance: number;
  sensitivity: number;
  width: number;
  height: number;
}

export type { IOriginalPoint, IGhostPoint, IWidgetModel, IScales };
