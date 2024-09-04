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
import { prepareEmbeddingInfo, updateUnstInfo } from "./utils";

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

  model.on("change:embedding_id", () => {
    const { origEmb, unstEmb, scales, legend, colors } =
      prepareEmbeddingInfo(model);
    updateUnstList([]);
    const unstInfo = updateUnstInfo(model, unstEmb, origEmb.length);

    scatterplotView.updateEmbedding(origEmb, unstEmb, scales, updateUnstList);
    legendView.update(legend, colors);
    settingsView.update("distance", model.get("distance"));
    unstableContainerView.update(
      unstEmb,
      unstInfo.numUnstables,
      unstInfo.percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  });

  model.on("change:distance", () => {
    const { unstEmb, scales } = prepareEmbeddingInfo(model);
    const { numUnstables, percentUnstables } = updateUnstInfo(
      model,
      unstEmb,
      origEmb.length
    );
    updateUnstList([]);

    scatterplotView.updateUnstEmbedding(unstEmb, scales, updateUnstList);
    settingsView.update("distance", model.get("distance"));
    unstableContainerView.update(
      unstEmb,
      numUnstables,
      percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  });

  model.on("change:sensitivity", () => {
    const { unstEmb, scales } = prepareEmbeddingInfo(model);
    const { numUnstables, percentUnstables } = updateUnstInfo(
      model,
      unstEmb,
      origEmb.length
    );
    updateUnstList([]);

    scatterplotView.updateUnstEmbedding(unstEmb, scales, updateUnstList);
    settingsView.update("sensitivity", model.get("sensitivity"));
    unstableContainerView.update(
      unstEmb,
      numUnstables,
      percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  });
  model.on("change:show_unstables", () => {
    const { unstEmb } = prepareEmbeddingInfo(model);
    scatterplotView.setVisibility(
      "unstables",
      model.get("show_unstables"),
      unstEmb
    );
    settingsView.update("show_unstables", model.get("show_unstables"));
  });
  model.on("change:show_neighbors", () => {
    scatterplotView.setVisibility("neighbors", model.get("show_neighbors"));
    settingsView.update("show_neighbors", model.get("show_neighbors"));
  });
  model.on("change:show_ghosts", () => {
    scatterplotView.setVisibility("ghosts", model.get("show_ghosts"));
    settingsView.update("show_ghosts", model.get("show_ghosts"));
  });

  model.on("change:unstableInfo", () => {
    const { unstEmb } = prepareEmbeddingInfo(model);
    const unstInfo = model.get("unstableInfo");

    unstableContainerView.update(
      unstEmb,
      unstInfo.numUnstables,
      unstInfo.percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  });

  model.on("change:checkedUnstables", () => {
    const { origEmb, unstEmb, ghostEmb, scales } = prepareEmbeddingInfo(model);
    const unstList = model.get("checkedUnstables");
    console.log("checkedUnstables", unstList);

    unstList.length === 0
      ? scatterplotView.resetDetail(unstEmb, scales, updateUnstList)
      : scatterplotView.updateDetail(origEmb, ghostEmb, scales, unstList);
    unstableContainerView.updateCheckbox(unstList);
  });

  el.appendChild(widget);
}

export default { render: renderWidget };
