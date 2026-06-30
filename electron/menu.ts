import { Menu, BrowserWindow } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import { basename } from "node:path";

interface MenuLabels {
  file: string;
  new: string;
  open: string;
  save: string;
  saveAs: string;
  openRecent: string;
  recentEmpty: string;
  view: string;
}

const LABELS: Record<string, MenuLabels> = {
  en: { file: "File", new: "New", open: "Open…", save: "Save", saveAs: "Save As…", openRecent: "Open Recent", recentEmpty: "No recent files", view: "View" },
  ja: { file: "ファイル", new: "新規", open: "開く…", save: "保存", saveAs: "名前を付けて保存…", openRecent: "最近使った項目を開く", recentEmpty: "最近使った項目なし", view: "表示" },
  "zh-TW": { file: "檔案", new: "新增", open: "開啟…", save: "儲存", saveAs: "另存新檔…", openRecent: "開啟最近的檔案", recentEmpty: "沒有最近的檔案", view: "檢視" },
  "zh-CN": { file: "文件", new: "新建", open: "打开…", save: "保存", saveAs: "另存为…", openRecent: "打开最近的文件", recentEmpty: "没有最近的文件", view: "视图" },
  ko: { file: "파일", new: "새로 만들기", open: "열기…", save: "저장", saveAs: "다른 이름으로 저장…", openRecent: "최근 파일 열기", recentEmpty: "최근 파일 없음", view: "보기" },
  fr: { file: "Fichier", new: "Nouveau", open: "Ouvrir…", save: "Enregistrer", saveAs: "Enregistrer sous…", openRecent: "Ouvrir récent", recentEmpty: "Aucun fichier récent", view: "Affichage" },
  es: { file: "Archivo", new: "Nuevo", open: "Abrir…", save: "Guardar", saveAs: "Guardar como…", openRecent: "Abrir reciente", recentEmpty: "Sin archivos recientes", view: "Ver" },
  de: { file: "Datei", new: "Neu", open: "Öffnen…", save: "Speichern", saveAs: "Speichern unter…", openRecent: "Zuletzt geöffnet", recentEmpty: "Keine zuletzt verwendeten Dateien", view: "Ansicht" },
  pt: { file: "Arquivo", new: "Novo", open: "Abrir…", save: "Salvar", saveAs: "Salvar como…", openRecent: "Abrir recente", recentEmpty: "Nenhum arquivo recente", view: "Visualizar" },
  it: { file: "File", new: "Nuovo", open: "Apri…", save: "Salva", saveAs: "Salva con nome…", openRecent: "Apri recenti", recentEmpty: "Nessun file recente", view: "Visualizza" },
  ru: { file: "Файл", new: "Создать", open: "Открыть…", save: "Сохранить", saveAs: "Сохранить как…", openRecent: "Открыть недавние", recentEmpty: "Нет недавних файлов", view: "Вид" },
};

function send(type: string, path?: string): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  win?.webContents.send("command", { type, path });
}

export function buildMenu(isDev: boolean, locale: string, recent: string[]): void {
  const L = LABELS[locale] ?? LABELS.en;
  const isMac = process.platform === "darwin";

  const recentItems: MenuItemConstructorOptions[] = recent.length
    ? recent.map((p) => ({ label: basename(p), click: () => send("open-recent", p) }))
    : [{ label: L.recentEmpty, enabled: false }];

  const fileMenu: MenuItemConstructorOptions = {
    label: L.file,
    submenu: [
      { label: L.new, accelerator: "CmdOrCtrl+N", click: () => send("new") },
      { label: L.open, accelerator: "CmdOrCtrl+O", click: () => send("open") },
      { label: L.openRecent, submenu: recentItems },
      { type: "separator" },
      { label: L.save, accelerator: "CmdOrCtrl+S", click: () => send("save") },
      { label: L.saveAs, accelerator: "CmdOrCtrl+Shift+S", click: () => send("save-as") },
      { type: "separator" },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as MenuItemConstructorOptions] : []),
    fileMenu,
    { role: "editMenu" },
    {
      label: L.view,
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        ...(isDev
          ? ([{ type: "separator" }, { role: "toggleDevTools" }, { role: "reload" }] as MenuItemConstructorOptions[])
          : []),
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
