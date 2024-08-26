import type { RenderProps } from "@anywidget/types";
import type { IWidget } from "@/model";
import {
  Scatterplot,
  Settings,
  Legend,
  UnstableContainer,
  Histogram,
} from "@/view";
import { html, render } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import {
  widgetStyle,
  leftStyle,
  scatterplotStyle,
  projectionStyle,
  legendStyle,
} from "./widgetStyles";

function renderWidget({ model, el }: RenderProps<IWidget>) {
  const widget = document.createElement("div");

  const scatterplot = new Scatterplot(model.get("width"), model.get("height"));
  const legend = new Legend(
    model.get("legend_width"),
    model.get("legend_height")
  );

  const settings = new Settings();
  const unstableContainer = new UnstableContainer();

  render(
    html` <div id="widget-container" style=${styleMap(widgetStyle)}>
      <div class="left" style=${styleMap(leftStyle)}>
        <div class="toolbar">${settings.render(model)}</div>
        <div class="unstable-container">${unstableContainer.render(model)}</div>
      </div>
      <div class="scatterplot" style=${styleMap(scatterplotStyle)}>
        <div class="projection" style=${styleMap(projectionStyle)}>
          ${scatterplot.render(model)}
        </div>
        <div class="legend" style=${styleMap(legendStyle)}>
          ${legend.render(model)}
        </div>
      </div>
      <!-- <div class="histogram">
        ${new Histogram(
        model.get("histogram_width"),
        model.get("histogram_height")
      ).render(model)}
      </div> -->
    </div>`,

    widget
  );

  model.on("change:embedding_id", () => {
    scatterplot.update(model);
    legend.update(model);
    settings.update("distance", model.get("distance"));
    unstableContainer.update(model);
  });

  model.on("change:distance", () => {
    scatterplot.updateUnstEmbedding(model);
    settings.update("distance", model.get("distance"));
    unstableContainer.update(model);
  });
  model.on("change:sensitivity", () => {
    scatterplot.updateUnstEmbedding(model);
    settings.update("sensitivity", model.get("sensitivity"));
    unstableContainer.update(model);
  });
  model.on("change:show_unstables", () => {
    scatterplot.setDetailVisibility(
      model.get("show_unstables"),
      model.get("show_ghosts"),
      model.get("show_neighbors")
    );
    settings.update("show_neighbors", model.get("show_neighbors"));
  });
  model.on("change:show_neighbors", () => {
    scatterplot.setDetailVisibility(
      model.get("show_unstables"),
      model.get("show_ghosts"),
      model.get("show_neighbors")
    );
    settings.update("show_neighbors", model.get("show_neighbors"));
  });
  model.on("change:show_ghosts", () => {
    scatterplot.setDetailVisibility(
      model.get("show_unstables"),
      model.get("show_ghosts"),
      model.get("show_neighbors")
    );
    settings.update("show_ghosts", model.get("show_ghosts"));
  });

  model.on("change:unstableInfo", () => {
    unstableContainer.update(model);
  });

  model.on("change:checkedUnstables", () => {
    scatterplot.updateDetail(model);
    unstableContainer.updateCheckbox(model);
  });

  el.appendChild(widget);
}

export default { render: renderWidget };
