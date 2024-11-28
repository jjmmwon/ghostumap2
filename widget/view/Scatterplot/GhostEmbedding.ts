import type { IScale, IGhostPoint } from "@/model";
import { arrayDifference } from "@/utils";
import * as d3 from "d3";

class GhostEmbedding {
  private group: d3.Selection<SVGGElement, undefined, null, undefined>;
  private unstableList: number[] = [];

  constructor(parent: d3.Selection<SVGGElement, undefined, null, undefined>) {
    this.group = parent.append("g").attr("class", "ghostEmbedding");
  }

  renderGhosts(id: number, ghostEmb: IGhostPoint[], scales: IScale) {
    const points = ghostEmb.find((d) => d.id === id)?.coords || [];
    // const label = ghostEmb.find((d) => d.id === id)?.label || "";
    console.log(points.map((d) => d.r));

    this.group
      .append("g")
      .selectAll("path")
      .data(points)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolTriangle).size(300))
      .attr("fill", (d) => scales.ghostColorScale(d.r))
      .attr(
        "transform",
        (d) => `translate(${scales.xScale(d.x)},${scales.yScale(d.y)})`
      )
      .attr("stroke", "black");
  }

  removeGhosts(id: number) {
    this.group.selectAll(`#ghost-${id}`).remove();
  }

  reset() {
    this.group.selectAll("g").remove();
    this.unstableList = [];
  }

  setVisibility(show: boolean) {
    this.group.attr("visibility", show ? "visible" : "hidden");
  }

  render(ghostEmb: IGhostPoint[], scales: IScale, unstableList: number[]) {
    const [enter, exit] = arrayDifference(this.unstableList, unstableList);

    enter.forEach((id) => this.renderGhosts(id, ghostEmb, scales));
    exit.forEach((id) => this.removeGhosts(id));
    this.unstableList = unstableList;
  }
}

export default GhostEmbedding;
