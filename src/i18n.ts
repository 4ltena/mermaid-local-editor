export type Locale = "en" | "ja";
export const LOCALES: Locale[] = ["en", "ja"];

const LS_KEY = "mle.lang";

type Dict = Record<string, string>;

export const DICT: Record<Locale, Dict> = {
  en: {
    "toolbar.sample": "Sample",
    "toolbar.theme": "Theme",
    "sample.placeholder": "— Select —",
    "title.sampleSelect": "Load a sample",
    "title.themeSelect": "Mermaid theme",
    "title.zoomOut": "Zoom out",
    "title.zoomReset": "Reset view",
    "title.zoomIn": "Zoom in",
    "title.copy": "Copy code",
    "title.svg": "Save SVG",
    "title.png": "Save PNG",
    "title.themeUi": "Toggle light/dark",
    "title.gutter": "Drag to resize",
    "title.lang": "Switch language",
    "btn.copy": "Copy",
    "status.ready": "Ready",
    "status.typing": "Typing…",
    "status.rendered": "Rendered",
    "status.syntaxError": "Syntax error",
    "status.copied": "Copied code",
    "status.copyFailed": "Copy failed",
    "status.noRender": "Nothing to export",
    "status.pngGenerating": "Generating PNG…",
    "status.pngSaved": "Saved PNG",
    "status.pngFailed": "PNG export failed",
    "status.svgSaved": "Saved SVG",
  },
  ja: {
    "toolbar.sample": "サンプル",
    "toolbar.theme": "テーマ",
    "sample.placeholder": "— 選択 —",
    "title.sampleSelect": "サンプルを読み込む",
    "title.themeSelect": "Mermaid テーマ",
    "title.zoomOut": "縮小",
    "title.zoomReset": "表示をリセット",
    "title.zoomIn": "拡大",
    "title.copy": "コードをコピー",
    "title.svg": "SVG を保存",
    "title.png": "PNG を保存",
    "title.themeUi": "画面の明暗を切替",
    "title.gutter": "ドラッグで幅を調整",
    "title.lang": "言語を切り替え",
    "btn.copy": "コピー",
    "status.ready": "準備完了",
    "status.typing": "入力中…",
    "status.rendered": "描画完了",
    "status.syntaxError": "構文エラー",
    "status.copied": "コードをコピーしました",
    "status.copyFailed": "コピーに失敗しました",
    "status.noRender": "描画結果がありません",
    "status.pngGenerating": "PNG を生成中…",
    "status.pngSaved": "PNG を保存しました",
    "status.pngFailed": "PNG 生成に失敗",
    "status.svgSaved": "SVG を保存しました",
  },
};

/** Pure key lookup. Fallback: requested locale -> ja -> the key itself. */
export function translate(locale: Locale, key: string): string {
  return DICT[locale]?.[key] ?? DICT.ja[key] ?? key;
}

/** Pure initial-locale resolution from a stored value and navigator language. */
export function resolveLocale(stored: string | null, navLang: string): Locale {
  if (stored === "en" || stored === "ja") return stored;
  return /^ja/i.test(navLang) ? "ja" : "en";
}

let current: Locale = "en";

export function getLocale(): Locale {
  return current;
}

/** Read persisted / navigator values and set the in-memory locale (no DOM writes). */
export function detectInitialLocale(): Locale {
  current = resolveLocale(localStorage.getItem(LS_KEY), navigator.language);
  return current;
}

export function t(key: string): string {
  return translate(current, key);
}

/** Apply translations to [data-i18n] textContent and [data-i18n-title] title. */
export function applyDom(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (k) el.textContent = t(k);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const k = el.dataset.i18nTitle;
    if (k) el.title = t(k);
  });
}

/** Set locale, persist, update <html lang>, and re-apply DOM translations. */
export function setLocale(locale: Locale): void {
  current = locale;
  localStorage.setItem(LS_KEY, locale);
  document.documentElement.lang = locale;
  applyDom();
}
