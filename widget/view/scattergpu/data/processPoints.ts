import { TPoints } from "@/view/scattergpu/types";
import { getScale } from "@/view/scattergpu/data/utils";

export function processPoints(points: TPoints): {
  pointArray: Float32Array;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
} {
  let xValues: number[], yValues: number[];

  if (Array.isArray(points) && Array.isArray(points[0])) {
    xValues = points.map((p) => p[0]);
    yValues = points.map((p) => p[1]);
  } else if ("x" in points && "y" in points) {
    xValues = points.x;
    yValues = points.y;
  } else {
    throw new Error("Invalid points format.");
  }

  const { min: xMin, max: xMax, range: xRange } = getScale(xValues);
  const { min: yMin, max: yMax, range: yRange } = getScale(yValues);

  const scaleFactor = 0.9;

  const pointArray = new Float32Array(
    xValues
      .map((x, i) => [
        (((x - xMin) / xRange) * 2 - 1) * scaleFactor,
        (((yValues[i] - yMin) / yRange) * 2 - 1) * scaleFactor,
      ])
      .flat()
  );

  return { pointArray, xMin, xMax, yMin, yMax };
}
