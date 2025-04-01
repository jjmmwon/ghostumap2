import type { RenderProps } from "@anywidget/types";
import type { IWidget } from "@/model";
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
import {
  renderLegend,
  renderSettings,
  ScatterplotRenderer,
  renderUnstableContainer,
} from "@/rendering";

async function renderWidget({ model, el }: RenderProps<IWidget>) {
  const widget = document.createElement("div");

  const { origEmb, unstEmb, ghostEmb, scales, legend, colors, radius } =
    prepareEmbeddingInfo(model);
  const unstInfo = updateUnstInfo(model, unstEmb, origEmb.length);

  const updateUnstList = (idList: number[]) => {
    model.set("checkedUnstables", idList);
    model.save_changes();
  };
  model.set("checkedUnstables", []);

  const scatterplotRenderer = new ScatterplotRenderer({
    width: model.get("width"),
    height: model.get("height"),
  });
  await scatterplotRenderer.init(updateUnstList);

  scatterplotRenderer.update(origEmb, unstEmb, ghostEmb, scales);

  const { legendView, renderedLegend } = renderLegend(
    legend,
    colors,
    radius,
    scales,
    model.get("legend_width"),
    model.get("legend_height")
  );
  const { settingsView, renderedSetting } = renderSettings(model);

  const { unstableContainerView, renderedUnstable } = renderUnstableContainer(
    unstEmb,
    unstInfo,
    updateUnstList,
    model
  );

  render(
    html` <div
      id="widget-container"
      class="container"
      style=${styleMap(widgetStyle)}
    >
      <div
        class="row"
        style="width:100%;display:flex;flex-direction:row; margin: 20px;"
      >
        <div class="col-md-3 left" style=${styleMap(leftStyle)}>
          <div class="toolbar">${renderedSetting}</div>
          <div class="unstable-container">${renderedUnstable}</div>
        </div>
        <div class="col-md-9 scatterplot" style=${styleMap(scatterplotStyle)}>
          <div style="display: flex; flex-direction: column; ">
            <div
              style="font-size: 2.5em; font-weight: bold; margin-bottom: 10px;"
              id="rd-title"
            >
              (${radius}, ${model.get("distance")})-Stable Projection
            </div>

            <div
              style="display: flex; flex-direction: row; justify-content: space-between;"
            >
              <div class="projection" style=${styleMap(projectionStyle)}>
                ${scatterplotRenderer.canvas}
              </div>
              <div class="legend" style=${styleMap(legendStyle)}>
                ${renderedLegend}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`,

    widget
  );

  attachModelListener(
    model,
    scatterplotRenderer,
    legendView,
    settingsView,
    unstableContainerView,
    updateUnstList
  );

  el.appendChild(widget);
}

export default { render: renderWidget };
