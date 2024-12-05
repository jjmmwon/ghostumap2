import type { IScale, IOriginalPoint } from "@/model";
import * as d3 from "d3";

class OriginalEmbedding {
  private group: d3.Selection<SVGGElement, undefined, null, undefined>;
  private showUnst: boolean = true;

  constructor(parent: d3.Selection<SVGGElement, undefined, null, undefined>) {
    this.group = parent.append("g").attr("class", "originalEmbedding");
  }

  render(origEmb: IOriginalPoint[], scales: IScale) {
    this.group
      .selectAll("circle")
      .data(origEmb)
      .join("circle")
      .attr("id", (d) => `circle-${d.id.toString()}`)
      .attr("cx", (d) => scales.xScale(d.x))
      .attr("cy", (d) => scales.yScale(d.y))
      .attr("r", 0.6)
      .attr("fill", (d) => scales.colorScale(d.label))
      .attr("id", (d) => `circle-${d.id.toString()}`);
  }

  setVisibility(show: boolean, unstEmb: IOriginalPoint[]) {
    this.showUnst = show;
    if (this.showUnst) {
      this.group.selectAll("circle").attr("visibility", "visible");
      return;
    }
    unstEmb.forEach((d) => {
      this.group
        .selectAll(`circle[id="circle-${d.id.toString()}"]`)
        .attr("visibility", "hidden");
    });
  }

  updateUnstEmbedding(unstEmb: IOriginalPoint[]) {
    this.group.selectAll("circle").attr("visibility", "visible");
    if (!this.showUnst) {
      unstEmb.forEach((id) => {
        this.group
          .selectAll(`circle[id="circle-${id.toString()}"]`)
          .attr("visibility", "hidden");
      });
    }
  }
}

export default OriginalEmbedding;
