import * as d3 from "d3";
import type { IOriginalPoint, IScale } from "@/model";

export const getScales = (
  origEmb: IOriginalPoint[],
  width: number,
  height: number,
  legend: string[],
  colors: { [key: string]: string }
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

  let colorScale: { [key: string]: string } = {};

  if (legend.length === 0 && Object.keys(colors).length === 0) {
    colorScale["None"] = d3.schemeTableau10[0];
  } else if (!legend.length) {
    colorScale = colors;
  } else {
    legend.forEach((d, i) => {
      colorScale[d] = d3.schemeTableau10[i];
    });
  }

  const range = {
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax,
  };

  return { xScale, yScale, colorScale, range };
};
