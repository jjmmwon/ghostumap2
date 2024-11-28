import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { max } from "d3";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";

const sliderStyle = {
  maxWidth: "200px",
  width: "100%",
};

const containerStyle = {
  display: "flex",
  "flex-direction": "column",
  "margin-bottom": "10px",
  maxWidth: "250px",
};

class Slider {
  private component: HTMLDivElement;

  constructor(
    public id: keyof IWidget,
    private label: string,
    private min: number,
    private max: number,
    private step: number
  ) {
    this.component = document.createElement("div");
  }

  render(model: AnyModel<IWidget>) {
    const value = model.get(this.id);
    const displayValue = typeof value === "number" ? value.toFixed(2) : "N/A";

    const template = html`
      <div class="slider-container" style=${styleMap(containerStyle)}>
        <label for="${this.id}" id="${this.id}-label"
          >${this.label}: ${displayValue}</label
        >

        <div style="display: flex; justify-content: space-between;">
          <span>0</span>
          <input
            type="range"
            id="${this.id}"
            min="${this.min}"
            max="${this.max}"
            step="${this.step}"
            style=${styleMap(sliderStyle)}
            .value="${typeof value === "number" ? value : 0}"
            @change="${(e: Event) => {
              model.set(this.id, +(e.target as HTMLInputElement).value);
              model.save_changes();
            }}"
          />
          <span>1</span>
        </div>
      </div>
    `;

    litRender(template, this.component);

    return this.component;
  }

  update(value: number): void {
    console.log("update", value);
    const displayValue = value.toFixed(2);
    const label = this.component.querySelector("label");
    const input = this.component.querySelector("input");

    console.log(label, input);

    if (label) {
      label.textContent = `${this.label}: ${displayValue}`;
    }

    if (input) {
      input.value = value.toString();
    }
  }
}

export default Slider;
