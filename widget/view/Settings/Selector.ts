import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html } from "lit-html";

class Selector {
  private id: keyof IWidget;
  private label: string;

  constructor() {
    this.id = "embedding_id";
    this.label = "Dataset";
  }

  render(model: AnyModel<IWidget>) {
    const embeddingID = model.get("embedding_id");
    const titles = model.get("embedding_set").map((e: any) => e.title);

    return html`
      <div class="selector-container">
        <label for="${this.id}">${this.label}</label>
        <select
          id="${this.id}"
          @change="${(e: Event) => {
            model.set(this.id, +(e.target as HTMLSelectElement).value);
            model.save_changes();
          }}"
        >
          ${titles.map((title: string, id: number) => {
            return html`
              <option value="${id}" ?selected="${id === embeddingID}">
                ${title}
              </option>
            `;
          })}
        </select>
      </div>
    `;
  }
}
export default Selector;
