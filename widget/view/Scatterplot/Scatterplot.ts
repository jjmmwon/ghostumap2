import type { IGhostPoint, IOriginalPoint, IScale, IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { prepareEmbeddingInfo } from "@/utils";

import * as d3 from "d3";

import OriginalEmbedding from "./OriginalEmbedding";
import GhostEmbedding from "./GhostEmbedding";
import UnstableEmbedding from "./UnstableEmbedding";
import NeighborEmbedding from "./NeighborEmbedding";

type VisibilityOption = "neighbors" | "ghosts" | "unstables";

class Scatterplot {
  private svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  private groupContainer: d3.Selection<SVGGElement, undefined, null, undefined>;

  private originalEmbedding: OriginalEmbedding;
  private unstableEmbedding: UnstableEmbedding;
  private ghostEmbedding: GhostEmbedding;
  private neighborEmbedding: NeighborEmbedding;

  constructor(private width: number, private height: number) {
    this.svg = this.createSVG();
    this.groupContainer = this.svg.append("g");

    this.originalEmbedding = new OriginalEmbedding(this.groupContainer);
    this.ghostEmbedding = new GhostEmbedding(this.groupContainer);
    this.neighborEmbedding = new NeighborEmbedding(this.groupContainer);
    this.unstableEmbedding = new UnstableEmbedding(this.groupContainer);
  }

  private createSVG(): d3.Selection<SVGSVGElement, undefined, null, undefined> {
    return d3
      .create("svg")
      .attr("class", "scatterplot")
      .attr("width", `${this.width}px`)
      .attr("height", `${this.height}px`)
      .on("contextmenu", (event) => {
        event.preventDefault();
        this.resetViewPoint();
      });
  }

  private resetViewPoint() {
    this.groupContainer
      .transition()
      .duration(750)
      .attr("transform", "translate(0,0) scale(1)");
  }

  updateEmbedding(
    origEmb: IOriginalPoint[],
    unstEmb: IOriginalPoint[],
    scales: IScale,
    updaetUnstList: (id: number[]) => void
  ) {
    this.originalEmbedding.render(origEmb, scales);
    this.unstableEmbedding.render(unstEmb, scales, (id: number) => {
      updaetUnstList([id]);
    });
  }

  render(
    origEmb: IOriginalPoint[],
    unstEmb: IOriginalPoint[],
    scales: IScale,
    updateUnstList: (id: number[]) => void
  ) {
    this.updateEmbedding(origEmb, unstEmb, scales, updateUnstList);
    this.svg.on("click", () => updateUnstList([]));

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

  updateUnstEmbedding(
    unstEmb: IOriginalPoint[],
    scales: IScale,
    updateUnstList: (id: number[]) => void
  ) {
    // this.resetUnstList(model);
    this.unstableEmbedding.render(unstEmb, scales, (id: number) => {
      updateUnstList([id]);
    });
    this.originalEmbedding.updateUnstEmbedding(unstEmb);
  }

  setVisibility(
    options: VisibilityOption,
    show: boolean,
    unstEmb: IOriginalPoint[] = []
  ) {
    switch (options) {
      case "neighbors":
        this.neighborEmbedding.setVisibility(show);
        break;
      case "ghosts":
        this.ghostEmbedding.setVisibility(show);
        break;
      case "unstables":
        this.originalEmbedding.setVisibility(show, unstEmb);
        this.unstableEmbedding.setVisibility(show);
        break;
    }
  }

  updateDetail(
    origEmb: IOriginalPoint[],
    ghostEmb: IGhostPoint[],
    scales: IScale,
    unstableList: number[]
  ) {
    this.ghostEmbedding.render(ghostEmb, scales, unstableList);
    this.neighborEmbedding.render(origEmb, scales, unstableList);
    this.unstableEmbedding.render(
      origEmb.filter((d) => unstableList.includes(d.id)),
      scales,
      (_: number) => {
        return;
      }
    );
  }

  resetDetail(
    unstEmb: IOriginalPoint[],
    scales: IScale,
    updaetUnstList: (id: number[]) => void
  ) {
    this.ghostEmbedding.reset();
    this.neighborEmbedding.reset();
    this.unstableEmbedding.render(unstEmb, scales, (id: number) => {
      updaetUnstList([id]);
    });
  }
}

export default Scatterplot;
