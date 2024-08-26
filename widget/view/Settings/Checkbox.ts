import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html } from "lit-html";

class Checkbox {
  constructor(private id: keyof IWidget, private label: string) {}

  render(model: AnyModel<IWidget>) {
    return html`
      <label>
        <input
          type="checkbox"
          id="${this.id}"
          .checked="${model.get(this.id)}"
          @change="${(e: Event) => {
            model.set(this.id, (e.target as HTMLInputElement).checked);
            model.save_changes();
          }}"
        />
        ${this.label}
      </label>
    `;
  }
}

export default Checkbox;
