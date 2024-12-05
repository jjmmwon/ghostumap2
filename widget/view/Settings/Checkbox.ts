import { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { html } from "lit-html";

class Checkbox {
  constructor(private id: keyof IWidget, private label: string) {}

  render(model: AnyModel<IWidget>) {
    return html`
      <label style="font-size: 18px;">
        <input
          type="checkbox"
          id="${this.id}"
          .checked="${model.get(this.id)}"
          width="100%"
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
