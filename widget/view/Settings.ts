import { IWidgetModel } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";

class Settings {
  container: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
  }

  private updateModel(
    model: AnyModel<IWidgetModel>,
    key: keyof IWidgetModel,
    value: number
  ) {
    model.set(key, value);
    this.render(model);
  }

  render(model: AnyModel<IWidgetModel>) {
    const template = html`
      <div class="settings-container">
        <h2>Settings</h2>
        <div class="slider-container">
          <label for="distance">Distance</label>
          <input
            type="range"
            id="distance"
            min="0"
            max="1"
            step="0.01"
            .value="${model.get("distance")}"
            @input="${(e: Event) =>
              this.updateModel(
                model,
                "distance",
                +(e.target as HTMLInputElement).value
              )}"
          />
          <span class="slider-value">${model.get("distance").toFixed(2)}</span>
        </div>
        <div class="slider-container">
          <label for="sensitivity">Sensitivity</label>
          <input
            type="range"
            id="sensitivity"
            min="0"
            max="1"
            step="0.01"
            .value="${model.get("sensitivity")}"
            @input="${(e: Event) =>
              this.updateModel(
                model,
                "sensitivity",
                +(e.target as HTMLInputElement).value
              )}"
          />
          <span class="slider-value"
            >${model.get("sensitivity").toFixed(2)}</span
          >
        </div>
      </div>
    `;

    litRender(template, this.container);
    return this.container;
  }
}

export default Settings;
