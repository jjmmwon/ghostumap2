import type { IScale, IWidget } from "@/model";
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

    this.symbolLegend.attr("transform", `translate(20, 150)`);
    this.symbolLegend
      .selectAll("path")
      .data(legends)
      .join("path")
      .attr(
        "d",
        d3
          .symbol()
          .type((d) => d.symbol)
          .size(200)
      )
      .attr("transform", (d, i) => `translate(0, ${20 + i * 28})`)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    this.symbolLegend
      .selectAll("text")
      .data(legends)
      .join("text")
      .text((d) => d.label)
      .attr("x", 20)
      .attr("y", (_, i) => 22 + i * 28)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "18px");
  }

  private renderLabelLegend(
    legends: string[],
    colors: { [key: string]: string },
    scales: IScale
  ) {
    if (legends.length === 0 && Object.keys(colors).length === 0) return;

    this.labelLegend.attr("transform", `translate(20, 260)`);

    if (!legends.length) {
      legends = Object.keys(colors!);
    } else {
      colors = legends.reduce<{ [key: string]: string }>((acc, label, i) => {
        acc[label] = d3.schemeTableau10[i % 10];
        return acc;
      }, {});
    }
    this.labelLegend
      .selectAll("circle")
      .data(legends)
      .join("circle")
      .attr("cx", 0)
      .attr("cy", (_, i) => 10 + i * 23)
      .attr("r", 7)
      .attr("fill", (d, i) => scales.colorScale(i.toString()));

    this.labelLegend
      .selectAll("text")
      .data(legends)
      .join("text")
      .text((d) => d)
      .attr("x", 15)
      .attr("y", (_, i) => 11 + i * 23)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "18px");
  }

  private renderGhostLegend(radius: number) {
    const ghostColorScale = d3
      .scaleSequential(d3.interpolateRgb("#000000", "#ffffff"))
      .domain([0, 1]); // domain을 뒤집어서 검정->흰색으로 변경
    this.ghostColorLegend.attr("transform", `translate(10, 80)`);

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
      .attr("font-size", "18px")
      .text("Ghost Color Scale");

    this.ghostColorLegend
      .append("text")
      .attr("x", 0)
      .attr("y", 50)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px")
      .text("0");

    this.ghostColorLegend
      .append("text")
      .attr("x", 160)
      .attr("y", 50)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px")
      .attr("text-anchor", "middle")
      .text(`${radius.toString()} (r)`);
  }

  render(
    legend: string[],
    colors: { [key: string]: string },
    radius: number,
    scales: IScale
  ) {
    this.renderSymbolLegend();
    this.renderLabelLegend(legend, colors, scales);
    this.renderGhostLegend(radius);
    return this.svg.node();
  }

  update(legend: string[], colors: { [key: string]: string }, scales: IScale) {
    this.renderLabelLegend(legend, colors, scales);
  }
}

export default Legend;
