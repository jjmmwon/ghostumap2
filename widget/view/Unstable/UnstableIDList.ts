import { IOriginalPoint, IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html, render as litRender } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import * as d3 from "d3";

const containerStyle = {
  height: "200px", // Limit the height to make it scrollable
  "max-width": "200px",
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

  onClick(model: AnyModel<IWidget>, id: number, checked: boolean): void {
    const checkedUnstables = model.get("checkedUnstables") || [];

    model.set(
      "checkedUnstables",
      checked
        ? [...checkedUnstables, id]
        : checkedUnstables.filter((d) => d !== id)
    );
    model.save_changes();
  }

  updateCheckbox(idList: number[]): void {
    console.log("updateCheckbox", idList);
    d3.selectAll(".unstable-list input").property("checked", false);
    idList.forEach((id) => {
      d3.select(`#unstable-${id}`).property("checked", true);
    });
  }

  reset(): void {
    d3.selectAll(".unstable-list input").property("checked", false);
  }

  update(model: AnyModel<IWidget>): void {
    const unstableEmb = model.get("unstableInfo")?.unstableEmb || [];
    const unstableIds = unstableEmb.map((d: IOriginalPoint) => d.id);

    const template = html`
      <div class="unstable-list" style=${styleMap(containerStyle)}>
        ${unstableIds.length
          ? unstableIds.map(
              (id) => html`
                <div style=${styleMap(itemStyle)}>
                  <input
                    type="checkbox"
                    id="unstable-${id}"
                    name="unstable-${id}"
                    @click=${(e: Event) =>
                      this.onClick(
                        model,
                        id,
                        (e.target as HTMLInputElement).checked
                      )}
                  />
                  <label for="unstable-${id}" style="margin-left: 5px;"
                    >${id}</label
                  >
                </div>
              `
            )
          : html`<div>None</div>`}
      </div>
    `;

    litRender(template, this.container);
  }

  render(model: AnyModel<IWidget>): HTMLDivElement {
    this.update(model);

    return this.container;
  }
}

export default UnstableIDList;
