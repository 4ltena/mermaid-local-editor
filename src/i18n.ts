export type Locale =
  | "en" | "ja" | "zh-TW" | "zh-CN" | "ko" | "fr" | "es" | "de" | "pt" | "it" | "ru";

export const LOCALES: { code: Locale; short: string; name: string }[] = [
  { code: "en", short: "EN", name: "English" },
  { code: "ja", short: "JA", name: "日本語" },
  { code: "zh-TW", short: "TW", name: "繁體中文" },
  { code: "zh-CN", short: "CN", name: "简体中文" },
  { code: "ko", short: "KR", name: "한국어" },
  { code: "fr", short: "FR", name: "Français" },
  { code: "es", short: "ES", name: "Español" },
  { code: "de", short: "DE", name: "Deutsch" },
  { code: "pt", short: "PT", name: "Português" },
  { code: "it", short: "IT", name: "Italiano" },
  { code: "ru", short: "RU", name: "Русский" },
];

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
    "title.export": "Export the diagram",
    "title.themeUi": "Toggle light/dark",
    "title.gutter": "Drag to resize",
    "title.lang": "Language",
    "btn.copy": "Copy",
    "btn.export": "Export",
    "export.title": "Export",
    "export.format": "Format",
    "export.size": "Size",
    "export.auto": "auto",
    "export.scale": "Scale",
    "export.custom": "custom",
    "export.lock": "Lock aspect ratio",
    "export.cancel": "Cancel",
    "export.run": "Export",
    "status.ready": "Ready",
    "status.typing": "Typing…",
    "status.rendered": "Rendered",
    "status.syntaxError": "Syntax error",
    "status.copied": "Copied code",
    "status.copyFailed": "Copy failed",
    "status.noRender": "Nothing to export",
    "status.exporting": "Exporting…",
    "status.exported": "Exported",
    "status.exportFailed": "Export failed",
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
    "title.export": "図を書き出す",
    "title.themeUi": "画面の明暗を切替",
    "title.gutter": "ドラッグで幅を調整",
    "title.lang": "言語",
    "btn.copy": "コピー",
    "btn.export": "Export",
    "export.title": "エクスポート",
    "export.format": "形式",
    "export.size": "サイズ",
    "export.auto": "auto",
    "export.scale": "倍率",
    "export.custom": "custom",
    "export.lock": "縦横比を固定",
    "export.cancel": "キャンセル",
    "export.run": "書き出す",
    "status.ready": "準備完了",
    "status.typing": "入力中…",
    "status.rendered": "描画完了",
    "status.syntaxError": "構文エラー",
    "status.copied": "コードをコピーしました",
    "status.copyFailed": "コピーに失敗しました",
    "status.noRender": "描画結果がありません",
    "status.exporting": "書き出し中…",
    "status.exported": "書き出しました",
    "status.exportFailed": "書き出しに失敗しました",
  },
  // Task 8 fills these from en via the translation workflow.
  "zh-TW": {}, "zh-CN": {}, ko: {}, fr: {}, es: {}, de: {}, pt: {}, it: {}, ru: {},
};

export function translate(locale: Locale, key: string): string {
  return DICT[locale]?.[key] ?? DICT.en[key] ?? key;
}

export function resolveLocale(stored: string | null, navLang: string): Locale {
  if (stored && LOCALES.some((l) => l.code === stored)) return stored as Locale;
  const n = navLang.toLowerCase();
  if (n.startsWith("zh")) return /tw|hant|hk|mo/.test(n) ? "zh-TW" : "zh-CN";
  if (n.startsWith("ja")) return "ja";
  if (n.startsWith("ko")) return "ko";
  if (n.startsWith("fr")) return "fr";
  if (n.startsWith("es")) return "es";
  if (n.startsWith("de")) return "de";
  if (n.startsWith("pt")) return "pt";
  if (n.startsWith("it")) return "it";
  if (n.startsWith("ru")) return "ru";
  return "en";
}

let current: Locale = "en";
export function getLocale(): Locale {
  return current;
}
export function detectInitialLocale(): Locale {
  current = resolveLocale(localStorage.getItem(LS_KEY), navigator.language);
  return current;
}
export function t(key: string): string {
  return translate(current, key);
}
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
export function setLocale(locale: Locale): void {
  current = locale;
  localStorage.setItem(LS_KEY, locale);
  document.documentElement.lang = locale;
  applyDom();
}
