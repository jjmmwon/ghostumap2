import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { max } from "d3";
import { html } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";

const sliderStyle = {
  maxWidth: "500px",
};

const containerStyle = {
  display: "flex",
  "flex-direction": "column",
  "margin-bottom": "10px",
};

class Slider {
  constructor(
    private id: keyof IWidget,
    private label: string,
    private min: number,
    private max: number,
    private step: number
  ) {}

  render(model: AnyModel<IWidget>) {
    const value = model.get(this.id);
    const displayValue = typeof value === "number" ? value.toFixed(2) : "N/A";

    return html`
      <div class="slider-container" style=${styleMap(containerStyle)}>
        <label for="${this.id}">${this.label}</label>
        <input
          type="range"
          id="${this.id}"
          min="${this.min}"
          max="${this.max}"
          step="${this.step}"
          .value="${typeof value === "number" ? value : 0}"
          @input="${(e: Event) => {
            model.set(this.id, +(e.target as HTMLInputElement).value);
            model.save_changes();
          }}"
        />
        <span class="slider-value" id="${this.id}-value">${displayValue}</span>
      </div>
    `;
  }
}

export default Slider;
