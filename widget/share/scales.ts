import * as d3 from "d3";
import type { IOriginalPoint, IScales } from "@/model";

export const getScales = (
  origEmb: IOriginalPoint[],
  width: number,
  height: number,
  distance: number
): IScales => {
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

  const colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

  const scaledDist = distance * (d3.max([xMax - xMin, yMax - yMin]) as number);

  return { xScale, yScale, colorScale, scaledDist };
};
