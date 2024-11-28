import { IOriginalPoint, IWidget } from "@/model";
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

const unstableContainerStyle = {
  maxWidth: "300px",
  width: "250px",
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

  update(
    unstEmb: IOriginalPoint[],
    numUnstables: number,
    percentUnstables: number,
    getUnstList: () => number[],
    updateUnstList: (idList: number[]) => void
  ): void {
    this.unstableCounter.update(numUnstables, percentUnstables);
    this.unstableIDList.update(unstEmb, getUnstList, updateUnstList);
  }

  updateCheckbox(idList: number[]): void {
    this.unstableIDList.updateCheckbox(idList);
  }

  render(
    unstEmb: IOriginalPoint[],
    numUnstables: number,
    percentUnstables: number,
    getUnstList: () => number[],
    updateUnstList: (idList: number[]) => void
  ): HTMLDivElement {
    const template = html`
      <div style=${styleMap(unstableContainerStyle)}>
        <div style=${styleMap(titleStyle)}>Unstable Points</div>
        <div style=${styleMap(componentStyle)}>
          ${this.unstableCounter.render(numUnstables, percentUnstables)}
        </div>
        <div style=${styleMap(componentStyle)}>
          ${this.unstableIDList.render(unstEmb, getUnstList, updateUnstList)}
        </div>
      </div>
    `;

    litRender(template, this.container);
    return this.container;
  }
}
