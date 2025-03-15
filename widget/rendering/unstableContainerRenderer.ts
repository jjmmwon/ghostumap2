// settingsRenderer.ts
import { IOriginalPoint, IUnstableInfo, IWidget } from "@/model";
import { UnstableContainer } from "@/view";
import { AnyModel } from "@anywidget/types";

export function renderUnstableContainer(
  unstEmb: IOriginalPoint[],
  unstInfo: IUnstableInfo,
  updateUnstList: (idList: number[]) => void,
  model: AnyModel<IWidget>
): {
  unstableContainerView: UnstableContainer;
  renderedUnstable: HTMLElement;
} {
  const unstableContainerView = new UnstableContainer();
  console.log(model.get("checkedUnstables"), "checkedUnstables");
  const renderedUnstable = unstableContainerView.render(
    unstEmb,
    unstInfo.numUnstables,
    unstInfo.percentUnstables,
    () => model.get("checkedUnstables"),
    updateUnstList
  );
  return { unstableContainerView, renderedUnstable };
}
