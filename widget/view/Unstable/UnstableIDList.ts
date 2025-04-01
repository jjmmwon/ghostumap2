import { IOriginalPoint, IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import * as d3 from "d3";

const containerStyle = {
  height: "100%",
  maxHeight: "360px",
  "max-width": "250px",
  "overflow-y": "auto",
  border: "1px solid #ccc",
  padding: "5px",
  "margin-top": "5px",
  "font-size": "0.9em",
  color: "#555",
};

const itemStyle = {
  display: "flex",
  "align-items": "center",
  "margin-bottom": "2px",
};

class UnstableIDList {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
  }

  onClick(
    id: number,
    checked: boolean,
    getUnstList: () => number[],
    updateUnstList: (idList: number[]) => void
  ): void {
    const checkedUnstables = getUnstList();
    updateUnstList(
      checked
        ? [...checkedUnstables, id]
        : checkedUnstables.filter((d) => d !== id)
    );
  }

  updateCheckbox(idList: number[]): void {
    d3.selectAll(".unstable-list input").property("checked", false);
    idList.forEach((id) => {
      d3.select(`#unstable-${id}`).property("checked", true);
    });
  }

  reset(): void {
    d3.selectAll(".unstable-list input").property("checked", false);
  }

  update(
    unstEmb: IOriginalPoint[],
    getUnstList: () => number[],
    updateUnstList: (idList: number[]) => void
  ): void {
    const sortedUnstEmb = unstEmb.sort((a, b) => b.radii[14] - a.radii[14]);
    // const sortedUnstEmb = unstEmb.sort((a, b) => b.radii[1] - a.radii[1]);

    const template = html`
      <div class="unstable-list" style=${styleMap(containerStyle)}>
        ${sortedUnstEmb.length
          ? sortedUnstEmb.map(
              (d) => html`
                <div style=${styleMap(itemStyle)}>
                  <input
                    type="checkbox"
                    id="unstable-${d.id}"
                    name="unstable-${d.id}"
                    @click=${(e: Event) =>
                      this.onClick(
                        d.id,
                        (e.target as HTMLInputElement).checked,
                        getUnstList,
                        updateUnstList
                      )}
                  />
                  <label for="unstable-${d.id}" style="margin-left: 5px;"
                    >${d.id}
                  </label>
                </div>
              `
            )
          : html`<div>None</div>`}
      </div>
    `;

    litRender(template, this.container);
  }

  render(
    unstEmb: IOriginalPoint[],
    getUnstList: () => number[],
    updateUnstList: (idList: number[]) => void
  ): HTMLDivElement {
    this.update(unstEmb, getUnstList, updateUnstList);

    return this.container;
  }
}

export default UnstableIDList;
