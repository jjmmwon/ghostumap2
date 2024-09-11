import type { RenderProps } from "@anywidget/types";
import type { IWidget } from "@/model";
import {
  Scatterplot,
  Settings,
  Legend,
  UnstableContainer,
  Histogram,
} from "@/view";
import { prepareEmbeddingInfo, updateUnstInfo } from "@/utils";

import { html, render } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";

import {
  widgetStyle,
  leftStyle,
  scatterplotStyle,
  projectionStyle,
  legendStyle,
} from "@/widgetStyles";
import { attachModelListener } from "@/eventHandler";

function renderWidget({ model, el }: RenderProps<IWidget>) {
  const widget = document.createElement("div");

  const scatterplotView = new Scatterplot(
    model.get("width"),
    model.get("height")
  );
  const legendView = new Legend(
    model.get("legend_width"),
    model.get("legend_height")
  );
  const settingsView = new Settings();
  const unstableContainerView = new UnstableContainer();

  const updateUnstList = (idList: number[]) => {
    model.set("checkedUnstables", idList);
    model.save_changes();
  };

  const { origEmb, unstEmb, scales, legend, colors } =
    prepareEmbeddingInfo(model);
  const unstInfo = updateUnstInfo(model, unstEmb, origEmb.length);

  render(
    html` <div id="widget-container" style=${styleMap(widgetStyle)}>
      <div class="left" style=${styleMap(leftStyle)}>
        <div class="toolbar">${settingsView.render(model)}</div>
        <div class="unstable-container">
          ${unstableContainerView.render(
            unstEmb,
            unstInfo.numUnstables,
            unstInfo.percentUnstables,
            () => model.get("checkedUnstables"),
            updateUnstList
          )}
        </div>
      </div>
      <div class="scatterplot" style=${styleMap(scatterplotStyle)}>
        <div class="projection" style=${styleMap(projectionStyle)}>
          ${scatterplotView.render(origEmb, unstEmb, scales, updateUnstList)}
        </div>
        <div class="legend" style=${styleMap(legendStyle)}>
          ${legendView.render(legend, colors)}
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

  attachModelListener(
    model,
    scatterplotView,
    legendView,
    settingsView,
    unstableContainerView,
    updateUnstList
  );

  el.appendChild(widget);
}

export default { render: renderWidget };
