import { TParams } from "@/view/scattergpu/types";
import { hexToRgb } from "@/view/scattergpu/utils/hexToRgb";

export function processColors(
  colors: TParams<string>,
  opacity: TParams<number>,
  pointCount: number
): Float32Array {
  colors = Array.isArray(colors) ? colors : Array(pointCount).fill(colors);
  opacity = Array.isArray(opacity) ? opacity : Array(pointCount).fill(opacity);

  if (pointCount !== colors.length || pointCount !== opacity.length) {
    throw new Error("Mismatch between number of points and colors or opacity.");
  }

  const colorData = new Float32Array(colors.length * 4);

  colors.forEach((color, i) => {
    const [r, g, b] = hexToRgb(color);
    colorData.set([r, g, b, opacity[i]], i * 4);
  });
  return colorData;
}
