import type { IScale, IOriginalPoint } from "@/model";
import { arrayDifference } from "@/share";
import * as d3 from "d3";

class NeighborEmbedding {
  private group: d3.Selection<SVGGElement, undefined, null, undefined>;
  private unstableList: number[] = [];

  constructor(parent: d3.Selection<SVGGElement, undefined, null, undefined>) {
    this.group = parent.append("g").attr("class", "neighborEmbedding");
  }

  renderNeighbors(id: number, origEmb: IOriginalPoint[], scales: IScale) {
    const { xScale, yScale, colorScale } = scales;
    const points = origEmb[id].neighbors.map((d) => origEmb[d]);

    this.group
      .append("g")
      .attr("id", `neighbor-${id}`)
      .selectAll("path")
      .data(points)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolWye).size(150))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("fill", (d) => colorScale[d.label])
      .attr("stroke", "black");
  }
  removeNeighbors(id: number) {
    this.group.selectAll(`#neighbor-${id}`).remove();
  }

  render(origEmb: IOriginalPoint[], scales: IScale, unstableList: number[]) {
    const [enter, exit] = arrayDifference(this.unstableList, unstableList);

    enter.forEach((id) => this.renderNeighbors(id, origEmb, scales));
    exit.forEach((id) => this.removeNeighbors(id));
    this.unstableList = unstableList;
  }
}

export default NeighborEmbedding;
