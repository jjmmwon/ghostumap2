import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";

import Slider from "./Slider";
import Checkbox from "./Checkbox";
// import Selector from "./Selector";
import * as d3 from "d3";

const settingContainerStyle = {
  maxWidth: "350px",
  width: "300px",
};

const titleStyle = {
  "font-size": "2.5em",
  "font-weight": "bold",
  "margin-bottom": "10px",
};

const componentStyle = {
  "margin-bottom": "10px",
};

const checkboxContainerStyle = {
  display: "flex",
  "flex-direction": "row",
  "justify-content": "space-between",
  "align-items": "center",
  "margin-bottom": "10px",
  maxWidth: "300px",
  width: "100%",
};

const sliderContainerStyle = {
  display: "flex",
  "flex-direction": "column",
  "margin-bottom": "10px",
  maxWidth: "300px",
  width: "100%",
};

class Settings {
  private container: HTMLDivElement;
  // private selector: Selector;
  private sliders: Slider[];
  private checkboxes: Checkbox[];

  constructor() {
    this.container = document.createElement("div");

    // this.selector = new Selector();
    this.sliders = [
      new Slider("distance", "Distance", 0.0, 1, 0.01),
      // new Slider("sensitivity", "Sensitivity", 0.01, 1, 0.01),
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
      this.sliders.find((slider) => slider.id === id)?.update(value);
    }
    if (
      ["show_neighbors", "show_ghosts", "show_unstables"].includes(id as string)
    ) {
      d3.select("#" + id).attr("checked", value);
    }
  }

  render(model: AnyModel<IWidget>): HTMLDivElement {
    const template = html`
      <div class="settings-container" style=${styleMap(settingContainerStyle)}>
        <div style=${styleMap(titleStyle)}>Settings</div>
        <div style=${styleMap(checkboxContainerStyle)}>
          ${this.checkboxes.map((checkbox) => checkbox.render(model))}
        </div>
        <div style=${styleMap(sliderContainerStyle)}>
          ${this.sliders.map(
            (slider) => html` <div>${slider.render(model)}</div> `
          )}
        </div>
      </div>
    `;

    litRender(template, this.container);
    return this.container;
  }
}

export default Settings;
