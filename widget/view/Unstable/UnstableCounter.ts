import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";

class UnstableCounter {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
  }

  update(model: AnyModel<IWidget>): void {
    const numUnstables = model.get("unstableInfo")?.numUnstables || 0;
    const percentUnstables = model.get("unstableInfo")?.percentUnstables || 0;

    const template = html`
      <div id="unstableInfo">
        Number of Unstables: ${numUnstables || 0}
        (${percentUnstables?.toFixed(4) || 0}%)
      </div>
    `;

    litRender(template, this.container);
  }

  render(model: AnyModel<IWidget>): HTMLDivElement {
    this.update(model);
    return this.container;
  }
}

export default UnstableCounter;
