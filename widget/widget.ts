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
import "bootstrap/dist/css/bootstrap.min.css";

function renderWidget({ model, el }: RenderProps<IWidget>) {
  const shadowRoot = el.shadowRoot || el.attachShadow({ mode: "open" });

  // 기존 내용 초기화
  if (shadowRoot.childNodes.length > 0) {
    shadowRoot.innerHTML = ""; // 또는 shadowRoot.replaceChildren();
  }

  // Shadow DOM 내부 컨테이너 생성
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
    html` <div
      id="widget-container"
      class="container"
      style=${styleMap(widgetStyle)}
    >
      <div class="row" style="width:100%;display:flex;flex-direction:row;">
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
          <div class="projection" style=${styleMap(projectionStyle)}>
            ${scatterplotView.render(origEmb, unstEmb, scales, updateUnstList)}
          </div>
          <div class="legend" style=${styleMap(legendStyle)}>
            ${legendView.render(legend, colors)}
          </div>
        </div>
      </div>
    </div>`,

    widget
  );

  shadowRoot.appendChild(widget);

  attachModelListener(
    model,
    scatterplotView,
    legendView,
    settingsView,
    unstableContainerView,
    updateUnstList
  );
}

export default { render: renderWidget };
