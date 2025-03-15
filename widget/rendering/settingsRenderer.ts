// settingsRenderer.ts
import { Settings } from "@/view";

export function renderSettings(model: any): {
  settingsView: Settings;
  renderedSetting: HTMLElement;
} {
  const settingsView = new Settings();
  return { settingsView, renderedSetting: settingsView.render(model) };
}
