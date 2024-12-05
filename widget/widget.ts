import type { RenderProps } from "@anywidget/types";
import type { IWidget } from "@/model";
import { Scatterplot, Settings, Legend, UnstableContainer } from "@/view";
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

  console.log(model.get("embedding_id"), model.get("embedding_set"));

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

  const { origEmb, unstEmb, scales, legend, colors, radius } =
    prepareEmbeddingInfo(model);
  const unstInfo = updateUnstInfo(model, unstEmb, origEmb.length);

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
                ${scatterplotView.render(
                  origEmb,
                  unstEmb,
                  scales,
                  updateUnstList
                )}
              </div>
              <div class="legend" style=${styleMap(legendStyle)}>
                ${legendView.render(legend, colors, radius, scales)}
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
    scatterplotView,
    legendView,
    settingsView,
    unstableContainerView,
    updateUnstList
  );

  el.appendChild(widget);
}

export default { render: renderWidget };
