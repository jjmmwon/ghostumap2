import * as d3 from "d3";
import type { IOriginalPoint, IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";
import { getScales } from "./scales";

const updateUnstableInfo = (
  model: AnyModel<IWidget>,
  unstEmb: IOriginalPoint[],
  totalPoints: number
) => {
  const unstableInfo = { ...model.get("unstableInfo") };

  unstableInfo.unstableEmb = unstEmb;
  unstableInfo.numUnstables = unstEmb.length;
  unstableInfo.percentUnstables = (unstEmb.length / totalPoints) * 100;

  model.set("unstableInfo", unstableInfo);
  model.save_changes();

  return unstEmb;
};

export const processData = (
  model: AnyModel<IWidget>,
  width: number = 0,
  height: number = 0
) => {
  const embeddingID = model.get("embedding_id");
  const {
    original_embedding: origEmb,
    ghost_embedding: ghostEmb,
    n_ghosts: nGhosts,
    legend,
    colors,
  } = model.get("embedding_set")[embeddingID];

  const scales = getScales(origEmb, width, height, legend, colors);
  const range = scales.range;

  const distance = model.get("distance");
  const sensitivity = model.get("sensitivity");

  const scaledSens = Math.floor(sensitivity * nGhosts);
  const scaledDist =
    distance *
    (d3.max([range.xMax - range.xMin, range.yMax - range.yMin]) as number);

  const unstEmb = origEmb.filter((d) => d.radii[scaledSens] > scaledDist);
  updateUnstableInfo(model, unstEmb, origEmb.length);
  console.log(model.get("unstableInfo"));

  return {
    origEmb,
    ghostEmb,
    unstEmb,
    scales,
    range,
    scaledDist,
    scaledSens,
  };
};
