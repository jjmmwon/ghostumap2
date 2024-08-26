interface IOriginalPoint {
  id: number;
  x: number;
  y: number;
  radii: number[];
  instability: number;
  label: string;
  neighbors: number[];
}

export default IOriginalPoint;
