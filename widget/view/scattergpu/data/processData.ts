import { PointStyleOptions, TData, TPoints } from "@/view/scattergpu/types";
import { processPoints } from "./processPoints";
import { processColors } from "./processColors";
import { processSizes } from "./processSizes";
import { processSymbols } from "./processSymbols";

export function processData(
  points: TPoints,
  pointStyle?: PointStyleOptions
): TData {
  const {
    color = "#FF0000",
    size = 10,
    opacity = 1.0,
    strokeColor = "#000000",
    strokeWidth = 0,
    symbol = "circle",
  } = pointStyle ?? {};

  const { pointArray } = processPoints(points);
  const colorData = processColors(color, opacity, pointArray.length / 2);
  const sizeData = processSizes(size, pointArray.length / 2);
  const strokeColorData = processColors(
    strokeColor,
    opacity,
    pointArray.length / 2
  );
  const strokeWidthData = Array.isArray(strokeWidth)
    ? new Float32Array(strokeWidth)
    : new Float32Array(Array(pointArray.length / 2).fill(strokeWidth));

  const { symbolData, symbolOffset } = processSymbols(
    symbol,
    pointArray.length / 2
  );

  return {
    vertex: pointArray,
    color: colorData,
    size: sizeData,
    strokeColor: strokeColorData,
    strokeWidth: strokeWidthData,
    offset: symbolOffset,
    symbol: symbolData,
  };
}
