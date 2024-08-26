import type { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import * as d3 from "d3";

export default class Histogram {
  private svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  private groupContainer: d3.Selection<SVGGElement, undefined, null, undefined>;
  private margin = { top: 20, right: 30, bottom: 40, left: 60 };

  constructor(private width: number, private height: number) {
    this.svg = this.createSVG();
    this.groupContainer = this.svg.append("g");
  }

  private createSVG(): d3.Selection<SVGSVGElement, undefined, null, undefined> {
    return d3
      .create("svg")
      .attr("class", "histogram")
      .attr("width", `${this.width}px`)
      .attr("height", `${this.height}px`);
  }

  render(model: AnyModel<IWidget>) {
    const origEmb =
      model.get("embedding_set")[model.get("embedding_id")].original_embedding;

    const instabilities = origEmb.map((d) => d.instability);

    // Clear previous content
    this.groupContainer.selectAll("*").remove();

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(instabilities) || 1])
      .nice()
      .range([0, innerWidth]);

    const histogram = d3
      .histogram()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(70)); // Increase number of bins

    const bins = histogram(instabilities);

    // Calculate cumulative frequencies
    let cumulative = 0;
    const cumulativeBins = bins.map((bin) => {
      cumulative += bin.length;
      return { ...bin, cumulative };
    });

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(cumulativeBins, (d) => d.cumulative) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Create the bars using cumulative frequencies
    this.groupContainer
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .selectAll("rect")
      .data(cumulativeBins)
      .join("rect")
      .attr("x", (d) => x(d.x0 || 0))
      .attr("width", (d) => Math.max(0, x(d.x1 || 0) - x(d.x0 || 0) - 1))
      .attr("y", (d) => y(d.cumulative))
      .attr("height", (d) => innerHeight - y(d.cumulative))
      .attr("fill", "steelblue");

    // Add x-axis
    this.groupContainer
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(10))
      .call((g) => g.select(".domain").remove()) // Remove domain line
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("y2", -innerHeight)
          .attr("stroke-opacity", 0.1)
      ); // Add light grid lines

    // Add y-axis
    this.groupContainer
      .append("g")
      .call(d3.axisLeft(y).ticks(10, "s")) // Use SI-prefix for large numbers
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", innerWidth)
          .attr("stroke-opacity", 0.1)
      ); // Add light grid lines

    // Add labels
    this.groupContainer
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text("Instability");

    this.groupContainer
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text("Cumulative Frequency");

    return this.svg.node();
  }
}
