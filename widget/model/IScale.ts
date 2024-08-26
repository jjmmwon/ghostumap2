import type IRange from "./IRange";

interface IScale {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  colorScale: { [key: string]: string };
  range: IRange;
}

export default IScale;
