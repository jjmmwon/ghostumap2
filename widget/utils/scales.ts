import * as d3 from "d3";
import type { IOriginalPoint, IScale } from "@/model";

export const getScales = (
  origEmb: IOriginalPoint[],
  width: number,
  height: number,
  legend: string[],
  colors: { [key: string]: string },
  radius: number
): IScale => {
  const [xMin, xMax] = d3.extent(origEmb, (d) => d.x) as [number, number];
  const [yMin, yMax] = d3.extent(origEmb, (d) => d.y) as [number, number];

  const xScale = d3
    .scaleLinear()
    .domain([xMin * 1.1, xMax * 1.1])
    .range([0, width]);
  const yScale = d3
    .scaleLinear()
    .domain([yMin * 1.1, yMax * 1.1])
    .range([height, 0]);

  let colorScale = d3
    .scaleOrdinal<string, string>()
    .domain(d3.range(legend.length).map(String))
    .range(d3.schemeTableau10 as string[]);

  let ghostColorScale = (classValue: string) => {
    const baseColor = colors[classValue] || colorScale(classValue);
    return (distance: number) => {
      const t = distance / radius; // normalize distance to [0, 1]
      return d3.interpolateRgb(baseColor, "#ffffff")(1 - t);
    };
  };

  const range = {
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax,
  };

  return { xScale, yScale, colorScale, range, ghostColorScale };
};
