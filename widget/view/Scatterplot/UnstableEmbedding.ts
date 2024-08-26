import type { IScale, IOriginalPoint } from "@/model";
import * as d3 from "d3";

class UnstableEmbedding {
  private group: d3.Selection<SVGGElement, undefined, null, undefined>;

  constructor(parent: d3.Selection<SVGGElement, undefined, null, undefined>) {
    this.group = parent.append("g").attr("class", "unstableEmbedding");
  }

  render(
    unstEmb: IOriginalPoint[],
    scales: IScale,
    onUnstableClick: (id: number) => void
  ) {
    const { xScale, yScale, colorScale } = scales;

    this.group
      .selectAll("path")
      .data(unstEmb)
      .join("path")
      .attr("d", d3.symbol(d3.symbolCross).size(200))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("fill", (d) => colorScale[d.label])
      .attr("pointer-events", "all")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("id", (d) => `unstPoint-${d.id.toString()}`)
      .on("click", (event, d) => {
        event.stopPropagation();
        onUnstableClick(d.id);
      });
  }

  resetView() {
    this.group
      .selectAll("path")
      .attr("visibility", "visible")
      .attr("pointer-events", "all");
  }

  update(unstableList: number[]) {
    if (unstableList.length === 0) {
      this.resetView();
      return;
    }

    this.group
      .selectAll("path")
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");

    unstableList.forEach((id) => {
      this.group
        .selectAll(`path[id="unstPoint-${id.toString()}"]`)
        .attr("visibility", "visible");
    });
  }
}

export default UnstableEmbedding;
