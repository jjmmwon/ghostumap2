import type { IWidgetModel, IGhostPoint, IOriginalPoint } from "@/model";
import { AnyModel } from "@anywidget/types";
import { getScales } from "@/share";
import * as d3 from "d3";

class Scatterplot {
  svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  groupContainer: d3.Selection<SVGGElement, undefined, null, undefined>;
  circleGroup: d3.Selection<SVGGElement, undefined, null, undefined>;
  unstableGroup: d3.Selection<SVGGElement, undefined, null, undefined>;
  ghostGroup: d3.Selection<SVGGElement, undefined, null, undefined>;
  neighborGroup: d3.Selection<SVGGElement, undefined, null, undefined>;
  legendGroup: d3.Selection<SVGGElement, undefined, null, undefined>;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.svg = d3
      .create("svg")
      .attr("class", "scatterplot")
      .attr("width", `${width}px`)
      .attr("height", `${height}px`)
      .on("click", () => {
        this._resetView();
      })
      .on("contextmenu", (event) => {
        event.preventDefault(); // Prevent the default context menu
        this.resetViewPoint();
      });
    this.groupContainer = this.svg.append("g");
    this.circleGroup = this.groupContainer.append("g");
    this.neighborGroup = this.groupContainer.append("g");
    this.ghostGroup = this.groupContainer.append("g");
    this.unstableGroup = this.groupContainer.append("g");
    this.legendGroup = this.groupContainer.append("g");
    this.width = width;
    this.height = height;
  }

  _render(model: AnyModel<IWidgetModel>) {
    const origEmb = model.get("original_embedding");
    const ghostEmb = model.get("ghost_embedding");
    const nGhosts = model.get("n_ghosts");
    const distance = model.get("distance");
    const sensitivity = Math.floor(model.get("sensitivity") * nGhosts);

    const { xScale, yScale, colorScale, scaledDist } = getScales(
      origEmb,
      this.width,
      this.height,
      distance
    );

    this.circleGroup
      .selectAll("circle")
      // .data(origEmb.filter((d) => d.radii[sensitivity] < scaledDist))
      .data(origEmb)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 1)
      .attr("fill", (d) => colorScale(d.label as string))
      .attr("id", (d) => d.id.toString());

    this.unstableGroup
      .selectAll("path")
      .data(origEmb.filter((d) => d.radii[sensitivity] >= scaledDist))
      .join("path")
      .attr("d", d3.symbol(d3.symbolCross).size(150))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("fill", (d) => colorScale(d.label as string))
      .attr("pointer-events", "all")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("id", (d) => d.id.toString())
      .on("click", (event, d) => {
        event.stopPropagation();
        this._showDetail(
          d.id,
          origEmb,
          ghostEmb,
          d.neighbors,
          xScale,
          yScale,
          colorScale
        );
      });

    // this.ghostGroup
    //   .selectAll("g")
    //   .data(ghostEmb)
    //   .join("g")
    //   .attr("id", (d) => d.id.toString())
    //   .selectAll("circle")
    //   .data((d) => d.positions)
    //   .join("circle")
    //   .attr("cx", (d) => xScale(d.x))
    //   .attr("cy", (d) => yScale(d.y))
    //   .attr("r", 1)
    //   .attr("fill", (_, i) =>
    //     ghostEmb[i].label ? colorScale(ghostEmb[i].label as string) : "black"
    //   );

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .filter((event) => event.type === "wheel")
      .on("zoom", (event) => {
        if (event.transform.k <= 1) {
          event.transform.k = 1;
          event.transform.x = 0;
          event.transform.y = 0;
        }
        this.groupContainer
          .transition()
          .delay(10)
          .attr("transform", event.transform);
      });

    // const drag = d3.drag<SVGSVGElement, unknown>().on("drag", (event) => {
    //   this.groupContainer.attr("transform", `translate(${event.x},${event.y})`);
    // });

    this.svg.call(zoom as any);
    // this.svg.call(drag as any);
  }

  _showDetail(
    id: number,
    origEmb: IOriginalPoint[],
    ghostEmb: IGhostPoint[],
    neighbors: number[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    colorScale: d3.ScaleOrdinal<string, string, never>
  ) {
    const ghostPoints = ghostEmb.filter((d) => d.id === id)[0].positions;

    this.neighborGroup
      .attr("id", id.toString())
      .selectAll("path")
      .data(neighbors)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolWye).size(100))
      .attr(
        "transform",
        (d) => `translate(${xScale(origEmb[d].x)},${yScale(origEmb[d].y)})`
      )
      .attr("fill", (d) => colorScale(origEmb[d].label as string))
      .attr("stroke", "black");

    this.ghostGroup
      .attr("id", id.toString())
      .selectAll("path")
      .data(ghostPoints)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolTriangle).size(100))
      .attr("fill", colorScale(origEmb[id].label as string))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("stroke", "black");

    this.unstableGroup
      .selectAll("path")
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");
    this.unstableGroup
      .selectAll(`path[id="${id}"]`)
      .attr("visibility", "visible");
  }

  resetViewPoint() {
    this.groupContainer
      .transition()
      .duration(750)
      .attr("transform", "translate(0,0) scale(1)");
  }

  _resetView() {
    console.log("resetView");
    this.unstableGroup
      .selectAll("path")
      .attr("visibility", "visible")
      .attr("pointer-events", "all");
    this.ghostGroup.selectAll("path").remove();
    this.neighborGroup.selectAll("path").remove();
  }

  render(model: AnyModel<IWidgetModel>) {
    this._render(model);
    return this.svg.node();
  }
}

export default Scatterplot;
