import { defineConfig } from "vite";

// Tauri expects a fixed dev port and uses TAURI_* env vars when bundling.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // Use relative asset paths so the built bundle works when loaded from the
  // Tauri/Capacitor file:// (or tauri://) context as well as a plain browser.
  base: "./",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      // tauri dev rebuilds the Rust side; don't let vite churn on src-tauri.
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // WebView2 / WKWebView / Android WebView all support modern ES.
    target: "es2021",
    minify: process.env.TAURI_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
