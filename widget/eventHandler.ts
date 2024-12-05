import { AnyModel } from "@anywidget/types";

import type { IWidget } from "@/model";
import { Scatterplot, Settings, Legend, UnstableContainer } from "@/view";
import { prepareEmbeddingInfo, updateUnstInfo } from "@/utils";

export function attachModelListener(
  model: AnyModel<IWidget>,
  scatterplotView: Scatterplot,
  legendView: Legend,
  settingsView: Settings,
  unstableContainerView: UnstableContainer,
  updateUnstList: (idList: number[]) => void
) {
  const handleEmbeddingChange = () => {
    const { origEmb, unstEmb, scales, legend, colors } =
      prepareEmbeddingInfo(model);
    updateUnstList([]);
    const unstInfo = updateUnstInfo(model, unstEmb, origEmb.length);

    scatterplotView.updateEmbedding(origEmb, unstEmb, scales, updateUnstList);
    legendView.update(legend, colors, scales);
    settingsView.update("distance", model.get("distance"));
    unstableContainerView.update(
      unstEmb,
      unstInfo.numUnstables,
      unstInfo.percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  };

  const handleParamsChange = (property: keyof IWidget) => {
    const { origEmb, unstEmb, scales } = prepareEmbeddingInfo(model);
    const { numUnstables, percentUnstables } = updateUnstInfo(
      model,
      unstEmb,
      origEmb.length
    );
    updateUnstList([]);

    scatterplotView.updateUnstEmbedding(unstEmb, scales, updateUnstList);
    settingsView.update(property, model.get(property) as number);
    unstableContainerView.update(
      unstEmb,
      numUnstables,
      percentUnstables,
      () => model.get("checkedUnstables"),
      updateUnstList
    );
  };

  const handleVisibilityChange = (
    property: "neighbors" | "ghosts" | "unstables"
  ) => {
    const { unstEmb } = prepareEmbeddingInfo(model);
    const optionKey = `show_${property}` as const;

    scatterplotView.setVisibility(property, model.get(optionKey), unstEmb);
    settingsView.update(optionKey, model.get(optionKey));
  };

  model.on("change:embedding_id", handleEmbeddingChange);

  model.on("change:distance", () => handleParamsChange("distance"));
  model.on("change:sensitivity", () => handleParamsChange("sensitivity"));

  model.on("change:show_unstables", () => handleVisibilityChange("unstables"));
  model.on("change:show_neighbors", () => handleVisibilityChange("neighbors"));
  model.on("change:show_ghosts", () => handleVisibilityChange("ghosts"));

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
}
