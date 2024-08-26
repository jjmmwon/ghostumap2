import type { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { processData } from "@/share";

import * as d3 from "d3";

import OriginalEmbedding from "./OriginalEmbedding";
import GhostEmbedding from "./GhostEmbedding";
import UnstableEmbedding from "./UnstableEmbedding";
import NeighborEmbedding from "./NeighborEmbedding";

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

  private resetView(model: AnyModel<IWidget>) {
    console.log("resetView");
    this.updateUnstList(model, []);
    this.unstableEmbedding.resetView();
  }

  private updateUnstList(model: AnyModel<IWidget>, idList: number[]) {
    model.set("checkedUnstables", idList);
    model.save_changes();
  }

  update(model: AnyModel<IWidget>) {
    const { origEmb, unstEmb, scales } = processData(
      model,
      this.width,
      this.height
    );
    this.resetView(model);

    this.originalEmbedding.render(origEmb, scales);
    this.unstableEmbedding.render(unstEmb, scales, (id: number) => {
      this.updateUnstList(model, [id]);
    });
  }

  render(model: AnyModel<IWidget>) {
    this.update(model);
    this.svg.on("click", () => this.resetView(model));

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

  updateUnstEmbedding(model: AnyModel<IWidget>) {
    const { unstEmb, scales } = processData(model, this.width, this.height);
    this.resetView(model);
    this.unstableEmbedding.render(unstEmb, scales, (id: number) => {
      this.updateUnstList(model, [id]);
    });
  }

  setDetailVisibility(
    show_unstables: boolean,
    show_ghosts: boolean,
    show_neighbors: boolean
  ) {
    d3.selectAll(".unstableEmbedding").attr(
      "visibility",
      show_unstables ? "visible" : "hidden"
    );

    d3.selectAll(".neighborEmbedding").attr(
      "visibility",
      show_neighbors ? "visible" : "hidden"
    );

    d3.selectAll(".ghostEmbedding").attr(
      "visibility",
      show_ghosts ? "visible" : "hidden"
    );
  }

  updateDetail(model: AnyModel<IWidget>) {
    const { origEmb, ghostEmb, scales } = processData(
      model,
      this.width,
      this.height
    );
    const unstableList = model.get("checkedUnstables");

    this.ghostEmbedding.render(ghostEmb, scales, unstableList);
    this.neighborEmbedding.render(origEmb, scales, unstableList);
    this.unstableEmbedding.update(unstableList);
  }
}

export default Scatterplot;
