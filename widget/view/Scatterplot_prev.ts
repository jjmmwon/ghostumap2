import type { IWidget, IScale, IOriginalPoint, IGhostPoint } from "@/model";
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

  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.svg = this.createSVG();

    this.groupContainer = this.svg.append("g");

    this.circleGroup = this.groupContainer
      .append("g")
      .attr("id", "circleGroup");
    this.neighborGroup = this.groupContainer
      .append("g")
      .attr("id", "neighborGroup");
    this.ghostGroup = this.groupContainer.append("g").attr("id", "ghostGroup");
    this.unstableGroup = this.groupContainer
      .append("g")
      .attr("id", "unstableGroup");
  }

  private createSVG(): d3.Selection<SVGSVGElement, undefined, null, undefined> {
    return d3
      .create("svg")
      .attr("class", "scatterplot")
      .attr("width", `${this.width}px`)
      .attr("height", `${this.height}px`)
      .on("click", () => this.resetView())
      .on("contextmenu", (event) => {
        event.preventDefault();
        this.resetViewPoint();
      });
  }

  private renderCircle(origEmb: IOriginalPoint[], scales: IScale) {
    this.circleGroup
      .selectAll("circle")
      .data(origEmb)
      .join("circle")
      .attr("cx", (d) => scales.xScale(d.x))
      .attr("cy", (d) => scales.yScale(d.y))
      .attr("r", 1)
      .attr("fill", (d) => scales.colorScale(d.label as string))
      .attr("id", (d) => `circle-${d.id.toString()}`);
  }

  private renderUnstables(
    origEmb: IOriginalPoint[],
    ghostEmb: IGhostPoint[],
    scales: IScale,
    scaledDist: number,
    scaledSens: number
  ) {
    const { xScale, yScale, colorScale } = scales;
    const unstableEmb = origEmb.filter((d) => d.radii[scaledSens] > scaledDist);

    this.unstableGroup
      .attr("numUnstables", unstableEmb.length)
      .attr("percentage", unstableEmb.length / origEmb.length);

    this.unstableGroup
      .selectAll("path")
      .data(unstableEmb)
      .join("path")
      .attr("d", d3.symbol(d3.symbolCross).size(100))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("fill", (d) => colorScale(d.label as string))
      .attr("pointer-events", "all")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("id", (d) => `unstable-${d.id.toString()}`)
      .on("click", (event, d) => {
        event.stopPropagation();
        this.renderDetail(d.id, d.neighbors, origEmb, ghostEmb, scales);
      });
  }

  private renderDetail(
    id: number,
    neighbors: number[],
    origEmb: IOriginalPoint[],
    ghostEmb: IGhostPoint[],
    scales: IScale
  ) {
    const ghostPoints = ghostEmb.find((d) => d.id === id)?.positions || [];
    const { xScale, yScale, colorScale } = scales;

    this.neighborGroup
      .attr("id", `neighbor-${id.toString()}`)
      .selectAll("path")
      .data(neighbors)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolWye).size(150))
      .attr(
        "transform",
        (d) => `translate(${xScale(origEmb[d].x)},${yScale(origEmb[d].y)})`
      )
      .attr("fill", (d) => colorScale(origEmb[d].label as string))
      .attr("stroke", "black");

    this.ghostGroup
      .attr("id", `ghost-${id.toString()}`)
      .selectAll("path")
      .data(ghostPoints)
      .join("path")
      .attr("pointer-events", "none")
      .attr("stroke-width", 1)
      .attr("d", d3.symbol(d3.symbolTriangle).size(150))
      .attr("fill", colorScale(origEmb[id].label as string))
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("stroke", "black");

    this.unstableGroup
      .selectAll("path")
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");

    this.unstableGroup
      .selectAll(`path[id="unstable-${id.toString()}"]`)
      .attr("visibility", "visible");
  }

  setDetailVisibility(show_neighbors: boolean, show_ghosts: boolean) {
    this.neighborGroup.attr(
      "visibility",
      show_neighbors ? "visible" : "hidden"
    );
    this.ghostGroup.attr("visibility", show_ghosts ? "visible" : "hidden");
  }

  private resetViewPoint() {
    this.groupContainer
      .transition()
      .duration(750)
      .attr("transform", "translate(0,0) scale(1)");
  }

  private resetView() {
    this.unstableGroup
      .selectAll("path")
      .attr("visibility", "visible")
      .attr("pointer-events", "all");
    this.ghostGroup.selectAll("path").remove();
    this.neighborGroup.selectAll("path").remove();
  }

  private prepareRenderingData(model: AnyModel<IWidget>) {
    const embeddingID = model.get("embedding_id");

    console.log(embeddingID, typeof embeddingID);
    console.log(model.get("embedding_set"));

    const {
      original_embedding: origEmb,
      ghost_embedding: ghostEmb,
      n_ghosts: nGhosts,
    } = model.get("embedding_set")[embeddingID];

    const scales = getScales(origEmb, this.width, this.height);
    const range = scales.range;

    const distance = model.get("distance");
    const sensitivity = model.get("sensitivity");

    const scaledSens = Math.floor(sensitivity * nGhosts);
    const scaledDist =
      distance *
      (d3.max([range.xMax - range.xMin, range.yMax - range.yMin]) as number);

    return {
      origEmb,
      ghostEmb,
      scales,
      range,
      scaledDist,
      scaledSens,
    };
  }

  render(model: AnyModel<IWidget>) {
    const { origEmb, ghostEmb, scales, scaledDist, scaledSens } =
      this.prepareRenderingData(model);

    model.set(
      "numUnstables",
      origEmb.filter((d) => d.radii[scaledSens] > scaledDist).length
    );

    this.renderCircle(origEmb, scales);
    this.renderUnstables(origEmb, ghostEmb, scales, scaledDist, scaledSens);

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

    this.svg.call(zoom as any);

    return this.svg.node();
  }

  updateUnstables(model: AnyModel<IWidget>) {
    const { origEmb, ghostEmb, scales, scaledDist, scaledSens } =
      this.prepareRenderingData(model);

    this.renderUnstables(origEmb, ghostEmb, scales, scaledDist, scaledSens);
  }
}

export default Scatterplot;
