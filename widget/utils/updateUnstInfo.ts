import { IOriginalPoint, IUnstableInfo, IWidget } from "@/model";
import { AnyModel } from "@anywidget/types";

export const updateUnstInfo = (
  model: AnyModel<IWidget>,
  unstEmb: IOriginalPoint[],
  totalPoints: number
): IUnstableInfo => {
  const unstableInfo = { ...model.get("unstableInfo") };

  unstableInfo.unstableEmb = unstEmb;
  unstableInfo.numUnstables = unstEmb.length;
  unstableInfo.percentUnstables = (unstEmb.length / totalPoints) * 100;

  model.set("unstableInfo", unstableInfo);
  model.save_changes();

  return unstableInfo;
};
