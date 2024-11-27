import { defineConfig } from "vite";
import anywidget from "@anywidget/vite";

export default defineConfig({
  build: {
    outDir: "ghostumap/static",
    lib: {
      entry: ["widget/widget.ts"],
      formats: ["es"],
    },
  },
  plugins: [anywidget()],

  resolve: {
    alias: {
      "@": "/widget",
    },
  },
});
