import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      lib: { entry: "electron/main.ts" },
      rollupOptions: { output: { format: "es", entryFileNames: "index.js" } },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      lib: { entry: "electron/preload.ts" },
      // Sandboxed preload must be CommonJS.
      rollupOptions: { output: { format: "cjs", entryFileNames: "index.cjs" } },
    },
  },
  renderer: {
    root: ".",
    base: "./",
    build: {
      outDir: "out/renderer",
      target: "es2021",
      // mermaid のダイアグラムチャンクは大きい。バンドル前提なので警告閾値を上げる。
      chunkSizeWarningLimit: 3000,
      rollupOptions: { input: resolve(__dirname, "index.html") },
    },
  },
});
