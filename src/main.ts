import "./styles.css";
import { CodeEditor } from "./editor";
import {
  configureMermaid,
  renderMermaid,
  svgIntrinsicSize,
  type MermaidTheme,
} from "./mermaid-render";
import { exportSvg, exportPng } from "./export";
import { SAMPLES, DEFAULT_CODE } from "./samples";

// ---------- persisted state ----------
const LS = {
  code: "mle.code",
  theme: "mle.theme",
  ui: "mle.uiTheme",
  split: "mle.split",
};

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};

const els = {
  editor: $("editor"),
  viewport: $<HTMLDivElement>("preview-viewport"),
  canvas: $<HTMLDivElement>("preview-canvas"),
  errorPanel: $<HTMLDivElement>("error-panel"),
  status: $("status-text"),
  sampleSelect: $<HTMLSelectElement>("sample-select"),
  themeSelect: $<HTMLSelectElement>("theme-select"),
  split: $<HTMLDivElement>("split"),
  gutter: $<HTMLDivElement>("gutter"),
  editorPane: document.querySelector<HTMLElement>(".pane--editor")!,
  btnZoomIn: $("btn-zoom-in"),
  btnZoomOut: $("btn-zoom-out"),
  btnZoomReset: $("btn-zoom-reset"),
  btnCopy: $("btn-copy"),
  btnSvg: $("btn-export-svg"),
  btnPng: $("btn-export-png"),
  btnThemeUi: $("btn-theme-ui"),
};

// ---------- UI (light/dark) theme ----------
function applyUiTheme(dark: boolean): void {
  document.documentElement.dataset.uiTheme = dark ? "dark" : "light";
  els.btnThemeUi.textContent = dark ? "☀️" : "🌙";
}

let uiDark = localStorage.getItem(LS.ui) === "dark";
applyUiTheme(uiDark);

// ---------- pan & zoom ----------
class PanZoom {
  scale = 1;
  tx = 0;
  ty = 0;
  private panning = false;
  private startX = 0;
  private startY = 0;

  constructor(
    private viewport: HTMLElement,
    private canvas: HTMLElement,
    private onChange: () => void,
  ) {
    viewport.addEventListener("wheel", this.onWheel, { passive: false });
    viewport.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
  }

  apply(): void {
    this.canvas.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
    this.onChange();
  }

  reset(): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.apply();
  }

  /** Fit the canvas content centered in the viewport. */
  fit(contentW: number, contentH: number): void {
    const vw = this.viewport.clientWidth;
    const vh = this.viewport.clientHeight;
    if (!contentW || !contentH || !vw || !vh) {
      this.reset();
      return;
    }
    const margin = 0.92;
    this.scale = Math.min((vw / contentW) * margin, (vh / contentH) * margin, 1);
    this.tx = (vw - contentW * this.scale) / 2;
    this.ty = (vh - contentH * this.scale) / 2;
    this.apply();
  }

  zoomBy(factor: number, cx?: number, cy?: number): void {
    const rect = this.viewport.getBoundingClientRect();
    const px = cx ?? rect.width / 2;
    const py = cy ?? rect.height / 2;
    const next = Math.min(8, Math.max(0.1, this.scale * factor));
    // keep the point under the cursor fixed
    this.tx = px - (px - this.tx) * (next / this.scale);
    this.ty = py - (py - this.ty) * (next / this.scale);
    this.scale = next;
    this.apply();
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.viewport.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
  };

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.panning = true;
    this.startX = e.clientX - this.tx;
    this.startY = e.clientY - this.ty;
    this.viewport.classList.add("is-panning");
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.panning) return;
    this.tx = e.clientX - this.startX;
    this.ty = e.clientY - this.startY;
    this.apply();
  };

  private onUp = (): void => {
    if (!this.panning) return;
    this.panning = false;
    this.viewport.classList.remove("is-panning");
  };
}

const panzoom = new PanZoom(els.viewport, els.canvas, () => {
  els.btnZoomReset.textContent = `${Math.round(panzoom.scale * 100)}%`;
});

// ---------- rendering ----------
let currentTheme =
  (localStorage.getItem(LS.theme) as MermaidTheme) ||
  (uiDark ? "dark" : "default");
els.themeSelect.value = currentTheme;
configureMermaid(currentTheme);

let lastGoodSize: { w: number; h: number } | null = null;
let renderToken = 0;

function showError(msg: string): void {
  els.errorPanel.hidden = false;
  els.errorPanel.textContent = msg;
  els.status.textContent = "構文エラー";
}

function clearError(): void {
  els.errorPanel.hidden = true;
  els.errorPanel.textContent = "";
}

async function render(code: string, refit: boolean): Promise<void> {
  const token = ++renderToken;
  try {
    const { svg } = await renderMermaid(code);
    if (token !== renderToken) return; // a newer render superseded us
    clearError();
    els.canvas.innerHTML = svg;
    const svgEl = els.canvas.querySelector("svg");
    if (svgEl) {
      const size = svgIntrinsicSize(svgEl as SVGSVGElement);
      svgEl.setAttribute("width", String(size.w));
      svgEl.setAttribute("height", String(size.h));
      svgEl.style.maxWidth = "none";
      if (refit || !lastGoodSize) panzoom.fit(size.w, size.h);
      lastGoodSize = size;
    }
    els.status.textContent = "描画完了";
  } catch (err) {
    if (token !== renderToken) return;
    const msg = err instanceof Error ? err.message : String(err);
    showError(msg);
  }
}

// ---------- editor ----------
let debounceTimer: number | undefined;
function scheduleRender(code: string): void {
  window.clearTimeout(debounceTimer);
  els.status.textContent = "入力中…";
  debounceTimer = window.setTimeout(() => {
    localStorage.setItem(LS.code, code);
    void render(code, false);
  }, 280);
}

const initialCode = localStorage.getItem(LS.code) ?? DEFAULT_CODE;

const editor = new CodeEditor({
  parent: els.editor,
  initialDoc: initialCode,
  dark: uiDark,
  onChange: scheduleRender,
});

// ---------- samples ----------
for (const s of SAMPLES) {
  const opt = document.createElement("option");
  opt.value = s.id;
  opt.textContent = s.label;
  els.sampleSelect.appendChild(opt);
}
els.sampleSelect.addEventListener("change", () => {
  const s = SAMPLES.find((x) => x.id === els.sampleSelect.value);
  if (s) {
    editor.setValue(s.code);
    void render(s.code, true);
    localStorage.setItem(LS.code, s.code);
  }
  // Leave the chosen option selected so the dropdown reflects which sample is
  // currently loaded (do not reset it back to the "— 選択 —" placeholder).
});

// ---------- theme select ----------
els.themeSelect.addEventListener("change", () => {
  currentTheme = els.themeSelect.value as MermaidTheme;
  localStorage.setItem(LS.theme, currentTheme);
  configureMermaid(currentTheme);
  void render(editor.getValue(), false);
});

// ---------- toolbar buttons ----------
els.btnZoomIn.addEventListener("click", () => panzoom.zoomBy(1.2));
els.btnZoomOut.addEventListener("click", () => panzoom.zoomBy(1 / 1.2));
els.btnZoomReset.addEventListener("click", () => {
  if (lastGoodSize) panzoom.fit(lastGoodSize.w, lastGoodSize.h);
  else panzoom.reset();
});

els.btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(editor.getValue());
    els.status.textContent = "コードをコピーしました";
  } catch {
    els.status.textContent = "コピーに失敗しました";
  }
});

function currentSvg(): SVGSVGElement | null {
  return els.canvas.querySelector("svg");
}

els.btnSvg.addEventListener("click", () => {
  const svg = currentSvg();
  if (svg) {
    exportSvg(svg);
    els.status.textContent = "SVG を保存しました";
  } else {
    els.status.textContent = "描画結果がありません";
  }
});

els.btnPng.addEventListener("click", async () => {
  const svg = currentSvg();
  if (!svg) {
    els.status.textContent = "描画結果がありません";
    return;
  }
  els.status.textContent = "PNG を生成中…";
  try {
    await exportPng(svg);
    els.status.textContent = "PNG を保存しました";
  } catch (e) {
    els.status.textContent = e instanceof Error ? e.message : "PNG 生成に失敗";
  }
});

els.btnThemeUi.addEventListener("click", () => {
  uiDark = !uiDark;
  localStorage.setItem(LS.ui, uiDark ? "dark" : "light");
  applyUiTheme(uiDark);
  editor.setDark(uiDark);
  // Keep the diagram readable in dark mode: follow the UI theme so the mermaid
  // edges/arrows and text stay visible. The テーマ dropdown can still override
  // this manually until the next UI-theme toggle.
  currentTheme = uiDark ? "dark" : "default";
  els.themeSelect.value = currentTheme;
  localStorage.setItem(LS.theme, currentTheme);
  configureMermaid(currentTheme);
  void render(editor.getValue(), false);
});

// ---------- split gutter resize ----------
(function setupGutter() {
  const saved = localStorage.getItem(LS.split);
  if (saved) els.editorPane.style.flexBasis = saved;

  let dragging = false;
  els.gutter.addEventListener("pointerdown", (e) => {
    dragging = true;
    els.gutter.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = els.split.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.min(0.8, Math.max(0.15, ratio));
    const basis = `${(clamped * 100).toFixed(2)}%`;
    els.editorPane.style.flexBasis = basis;
    localStorage.setItem(LS.split, basis);
  });
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = "";
  });
})();

// ---------- keyboard shortcuts ----------
window.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.key === "=" || e.key === "+") {
    e.preventDefault();
    panzoom.zoomBy(1.2);
  } else if (e.key === "-") {
    e.preventDefault();
    panzoom.zoomBy(1 / 1.2);
  } else if (e.key === "0") {
    e.preventDefault();
    if (lastGoodSize) panzoom.fit(lastGoodSize.w, lastGoodSize.h);
  }
});

// ---------- initial render ----------
void render(initialCode, true);
editor.focus();
