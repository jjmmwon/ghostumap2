import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import UnstableCounter from "./UnstableCounter";
import UnstableIDList from "./UnstableIDList";

const componentStyle = {
  "margin-top": "10px",
};

const titleStyle = {
  "font-size": "2em",
  "font-weight": "bold",
};

export default class UnstableContainer {
  private container: HTMLDivElement;
  private unstableCounter: UnstableCounter;
  private unstableIDList: UnstableIDList;

  constructor() {
    this.container = document.createElement("div");
    this.unstableCounter = new UnstableCounter();
    this.unstableIDList = new UnstableIDList();
  }

  update(model: AnyModel<IWidget>): void {
    this.unstableCounter.update(model);
    this.unstableIDList.update(model);
  }

  updateCheckbox(model: AnyModel<IWidget>): void {
    const idList = model.get("checkedUnstables") || [];
    this.unstableIDList.updateCheckbox(idList);
  }

  render(model: AnyModel<IWidget>): HTMLDivElement {
    const template = html`
      <div style=${styleMap(titleStyle)}>Unstables</div>
      <div style=${styleMap(componentStyle)}>
        ${this.unstableCounter.render(model)}
      </div>
      <div style=${styleMap(componentStyle)}>
        ${this.unstableIDList.render(model)}
      </div>
    `;

    litRender(template, this.container);
    return this.container;
  }
}
