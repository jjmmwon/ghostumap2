interface IPosition {
  x: number;
  y: number;
  r: number;
}

interface IGhostPoint {
  id: number;
  coords: IPosition[];
  label: number | string | null;
}

export default IGhostPoint;
