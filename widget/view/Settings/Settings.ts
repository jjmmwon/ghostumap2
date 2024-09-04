import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";

import Slider from "./Slider";
import Checkbox from "./Checkbox";
import Selector from "./Selector";
import * as d3 from "d3";

const titleStyle = {
  "font-size": "2em",
  "font-weight": "bold",
  "margin-bottom": "10px",
};

const componentStyle = {
  "margin-bottom": "10px",
};

const checkboxContainerStyle = {
  display: "flex",
  "align-items": "center",
  "margin-bottom": "10px",
};

class Settings {
  private container: HTMLDivElement;
  private selector: Selector;
  private sliders: Slider[];
  private checkboxes: Checkbox[];

  constructor() {
    this.container = document.createElement("div");

    this.selector = new Selector();
    this.sliders = [
      new Slider("distance", "Distance", 0.01, 1, 0.01),
      new Slider("sensitivity", "Sensitivity", 0.01, 1, 0.01),
    ];
    this.checkboxes = [
      new Checkbox("show_unstables", "Unstables"),
      new Checkbox("show_neighbors", "Neighbors"),
      new Checkbox("show_ghosts", "Ghosts"),
    ];
  }

  update(id: keyof IWidget, value: number | boolean): void {
    const isSlider = ["distance", "sensitivity"].includes(id as string);

    if (isSlider && typeof value === "number") {
      d3.select("#" + id).attr("value", value.toString());
      d3.select("#" + id + "-value").text(value.toFixed(2));
    }
    if (
      ["show_neighbors", "show_ghosts", "show_unstables"].includes(id as string)
    ) {
      d3.select("#" + id).attr("checked", value);
    }
  }

  render(model: AnyModel<IWidget>): HTMLDivElement {
    const template = html`
      <div class="settings-container">
        <div style=${styleMap(titleStyle)}>Settings</div>
        <div style=${styleMap(componentStyle)}>
          ${this.selector.render(model)}
        </div>
        <div style=${styleMap(checkboxContainerStyle)}>
          ${this.checkboxes.map((checkbox) => checkbox.render(model))}
        </div>
        ${this.sliders.map(
          (slider) => html` <div>${slider.render(model)}</div> `
        )}
      </div>
    `;

    litRender(template, this.container);
    return this.container;
  }
}

export default Settings;
