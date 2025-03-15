// legendRenderer.ts
import { IScale } from "@/model";
import { Legend } from "@/view";

export function renderLegend(
  legendData: string[],
  colors: { [key: string]: string },
  radius: number,
  scales: IScale,
  width: number,
  height: number
): {
  legendView: Legend;
  renderedLegend: SVGElement | null;
} {
  const legendView = new Legend(width, height);
  return {
    legendView,
    renderedLegend: legendView.render(legendData, colors, radius, scales),
  };
}
