import * as d3 from "d3";
import type { IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { getScales } from "./scales";

export const prepareEmbeddingInfo = (model: AnyModel<IWidget>) => {
  const embeddingID = model.get("embedding_id");
  const [width, height] = [model.get("width"), model.get("height")];
  const {
    original_embedding: origEmb,
    ghost_embedding: ghostEmb,
    n_ghosts: nGhosts,
    r: radius,
    legend,
    colors,
  } = model.get("embedding_set")[embeddingID];

  const scales = getScales(origEmb, width, height, legend, colors, radius);
  const range = scales.range;

  const distance = model.get("distance");
  const sensitivity = model.get("sensitivity");

  const scaledSens = Math.ceil(sensitivity * (nGhosts - 1));
  // const scaledSens = 1;
  const scaledDist =
    distance *
    (d3.max([range.xMax - range.xMin, range.yMax - range.yMin]) as number);

  const unstEmb = origEmb.filter((d) => d.radii[scaledSens] > scaledDist);

  return {
    origEmb,
    ghostEmb,
    radius,
    unstEmb,
    scales,
    range,
    scaledDist,
    scaledSens,
    legend,
    colors,
  };
};
