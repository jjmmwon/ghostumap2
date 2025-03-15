import { TParams, TSymbols } from "@/view/scattergpu/types";

export function processSymbols(
  symbol: TParams<TSymbols>,
  pointCount: number
): {
  symbolData: Uint32Array;
  symbolOffset: Float32Array;
} {
  const symbolMap = {
    circle: 0,
    square: 1,
    triangle: 2,
    diamond: 3,
    cross: 4,
  };
  const symbolData = Array.isArray(symbol)
    ? new Uint32Array(symbol.map((s) => symbolMap[s]))
    : new Uint32Array(pointCount).fill(symbolMap[symbol]);

  return {
    symbolData,
    symbolOffset: new Float32Array([
      -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    ]),
  };
}
