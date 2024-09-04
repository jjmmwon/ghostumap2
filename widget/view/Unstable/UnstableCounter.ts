import { html, render as litRender } from "lit-html";

class UnstableCounter {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
  }

  update(numUnstables: number, percentUnstables: number): void {
    const template = html`
      <div id="unstableInfo">
        Number of Unstables: ${numUnstables || 0}
        (${percentUnstables?.toFixed(4) || 0}%)
      </div>
    `;

    litRender(template, this.container);
  }

  render(numUnstables: number, percentUnstables: number): HTMLDivElement {
    this.update(numUnstables, percentUnstables);
    return this.container;
  }
}

export default UnstableCounter;
