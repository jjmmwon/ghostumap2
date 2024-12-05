import type IRange from "./IRange";
import type { ScaleLinear, ScaleOrdinal } from "d3";

interface IScale {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colorScale: ScaleOrdinal<string, string>;
  ghostColorScale: (classValue: string) => (distance: number) => string;
  range: IRange;
}

export default IScale;
