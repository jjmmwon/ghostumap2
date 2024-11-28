import type { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import * as d3 from "d3";

class Legend {
  svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  symbolLegend: d3.Selection<SVGGElement, undefined, null, undefined>;
  labelLegend: d3.Selection<SVGGElement, undefined, null, undefined>;
  ghostColorLegend: d3.Selection<SVGGElement, undefined, null, undefined>;

  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.svg = this.createSVG();
    this.symbolLegend = this.svg.append("g");
    this.labelLegend = this.svg.append("g");
    this.ghostColorLegend = this.svg.append("g");
  }

  private createSVG(): d3.Selection<SVGSVGElement, undefined, null, undefined> {
    return d3
      .create("svg")
      .attr("class", "legend")
      .attr("width", `${this.width}px`)
      .attr("height", `${this.height}px`);
  }

  private renderSymbolLegend() {
    const legends = [
      { label: "Unstable", symbol: d3.symbolCross },
      { label: "Ghost", symbol: d3.symbolTriangle },
      { label: "Neighbor", symbol: d3.symbolWye },
    ];

    this.symbolLegend.attr("transform", `translate(20, 300)`);
    this.symbolLegend
      .selectAll("path")
      .data(legends)
      .join("path")
      .attr(
        "d",
        d3
          .symbol()
          .type((d) => d.symbol)
          .size(150)
      )
      .attr("transform", (d, i) => `translate(0, ${20 + i * 25})`)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    this.symbolLegend
      .selectAll("text")
      .data(legends)
      .join("text")
      .text((d) => d.label)
      .attr("x", 20)
      .attr("y", (_, i) => 22 + i * 25)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px");
  }

  private renderLabelLegend(
    legends: string[],
    colors: { [key: string]: string }
  ) {
    if (legends.length === 0 && Object.keys(colors).length === 0) return;

    this.labelLegend.attr("transform", `translate(20, 400)`);

    if (!legends.length) {
      legends = Object.keys(colors!);
    } else {
      colors = legends.reduce<{ [key: string]: string }>((acc, label, i) => {
        acc[label] = d3.schemeTableau10[i];
        return acc;
      }, {});
    }

    this.labelLegend
      .selectAll("circle")
      .data(legends)
      .join("circle")
      .attr("cx", 0)
      .attr("cy", (_, i) => 10 + i * 20)
      .attr("r", 6)
      .attr("fill", (d) => colors![d]);

    this.labelLegend
      .selectAll("text")
      .data(legends)
      .join("text")
      .text((d) => d)
      .attr("x", 15)
      .attr("y", (_, i) => 11 + i * 20)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px");
  }

  private renderGhostLegend(radius: number) {
    const ghostColorScale = d3.scaleSequential(d3.interpolateViridis);
    this.ghostColorLegend.attr("transform", `translate(10, 220)`);

    const gradient = this.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "ghost-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient
      .selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .enter()
      .append("stop")
      .attr("offset", (d) => `${d * 100}%`)
      .attr("stop-color", (d) => ghostColorScale(d));

    this.ghostColorLegend
      .append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 150)
      .attr("height", 20)
      .style("fill", "url(#ghost-gradient)");

    this.ghostColorLegend
      .append("text")
      .attr("x", 0)
      .attr("y", 10)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px")
      .text("Ghost Color Scale");

    this.ghostColorLegend
      .append("text")
      .attr("x", 0)
      .attr("y", 50)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "12px")
      .text("0");

    this.ghostColorLegend
      .append("text")
      .attr("x", 150)
      .attr("y", 50)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "12px")
      .attr("text-anchor", "end")
      .text(radius.toString());
  }

  render(legend: string[], colors: { [key: string]: string }, radius: number) {
    this.renderSymbolLegend();
    this.renderLabelLegend(legend, colors);
    this.renderGhostLegend(radius);
    return this.svg.node();
  }

  update(legend: string[], colors: { [key: string]: string }) {
    this.renderLabelLegend(legend, colors);
  }
}

export default Legend;
