import type { RenderProps } from "@anywidget/types";
import type { IWidgetModel } from "@/model";
import { Scatterplot, Settings } from "@/view";
import { html, render } from "lit-html";
import "./widget.css";

function renderWidget({ model, el }: RenderProps<IWidgetModel>) {
  const widget = document.createElement("div");

  const width = model.get("width");
  const height = model.get("height");

  const scatterplotView = new Scatterplot(width, height);
  const toolbar = new Settings();

  model.on("change:original_embedding", () => {
    scatterplotView._render(model);
  });
  model.on("change:radii", () => {
    scatterplotView._render(model);
  });
  model.on("change:distance", () => {
    // console.log(model.get("distance"));
    scatterplotView._render(model);
  });
  model.on("change:sensitivity", () => {
    // console.log(model.get("sensitivity"));
    scatterplotView._render(model);
  });

  render(
    html` <div id="widget-container">
      <div class="projection">${scatterplotView.render(model)}</div>
      <div class="toolbar">${toolbar.render(model)}</div>
    </div>`,

    widget
  );

  el.appendChild(widget);
}

export default { render: renderWidget };
