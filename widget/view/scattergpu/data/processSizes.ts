import { TParams } from "@/view/scattergpu/types";

export function processSizes(
  sizes: TParams<number>,
  pointCount: number
): Float32Array {
  sizes = Array.isArray(sizes) ? sizes : Array(pointCount).fill(sizes);

  if (sizes.length !== pointCount) {
    throw new Error("Mismatch between number of points and sizes.");
  }

  return new Float32Array(sizes);
}
