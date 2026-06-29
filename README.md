![Version](https://img.shields.io/github/v/release/4ltena/mermaid-local-editor)
![License](https://img.shields.io/github/license/4ltena/mermaid-local-editor)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![HTML5 / CSS3](https://img.shields.io/badge/HTML5_%2F_CSS3-E34F26?logo=html5&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)
![Downloads](https://img.shields.io/github/downloads/4ltena/mermaid-local-editor/total?label=downloads)
![CI](https://img.shields.io/github/actions/workflow/status/4ltena/mermaid-local-editor/ci.yml?branch=main&label=CI)

# Mermaid Local Editor

完全ローカルで動く、クロスプラットフォームの Mermaid ダイアグラムエディタ
A fully local, cross-platform Mermaid diagram editor.

---

## 日本語 | [English](#english)

---

## 日本語

### これは何？
**完全ローカル・オフライン**で動く Mermaid 編集アプリです。Electron + Vite + TypeScript 製で、コードを書くと右側のプレビューに図がリアルタイムで描画されます。図の生成はすべて端末内で完結し、ネットワーク通信は行いません。

### 主な機能
- **ライブプレビュー** — CodeMirror エディタに入力すると、デバウンス付きで即座に再描画。構文エラーはパネル表示し、直前の正常な図は保持。
- **ダーク/ライト対応** — UI のダーク切替に図のテーマが連動し、ダーク時は矢印・文字が見える mermaid の `dark` テーマへ自動切替（`default`/`dark`/`forest`/`neutral` の手動選択も可）。
- **パン & ズーム** — ホイールズーム、ドラッグでパン、フィット表示。
- **エクスポート** — Export ダイアログから SVG / PNG / WebP を書き出し（サイズは auto 倍率または custom px×px、縦横比固定）。コードのクリップボードコピーにも対応。
- **サンプル & 永続化** — 代表的な図種のサンプルを同梱。コード・テーマ・分割幅は `localStorage` に自動保存。
- **多言語UI** — 11言語（英語/日本語/繁体中文/简体中文/한국어/Français/Español/Deutsch/Português/Italiano/Русский）。ヘッダーのプルダウンで切替（初回は OS の言語に追従し、選択は保存）。
- **完全ローカル / オフライン** — mermaid・CodeMirror をバンドル。外部 CDN・fetch・トラッキングなし。
- **ハードニング** — 本番ビルドは厳格な CSP、`contextIsolation` / `sandbox` 有効、独自 `app://` プロトコルで配信。

### 動作環境
- macOS / Windows / Linux（Arch / AlmaLinux / Ubuntu）
- 開発時: Node 24

### 開発・実行
```bash
npm install
npm run dev        # Electron アプリを HMR 付きで起動
```

品質チェック:
```bash
npm run typecheck  # レンダラ + Electron(main) の型検査
npm test           # vitest（パス解決・i18n のユニットテスト）
npm run build      # electron-vite build -> out/
```

### パッケージ作成（各OS）
ネイティブアプリは**それぞれのOS上**でのみビルドできます。
```bash
npm run dist:mac   # release/*-universal.dmg, *.zip（macOS で実行・Apple Silicon + Intel）
npm run dist:win   # release/*.exe (nsis)           （Windows で実行）
npm run dist:linux # release/*.AppImage, *.deb, *.rpm, *.pacman （Linux で実行）
```

### リリース（CI/CD）
リリースはバージョンタグで GitHub Actions が生成します。
```bash
# package.json の "version" を合わせてから:
git tag v0.1.0
git push origin v0.1.0
```
`.github/workflows/release.yml` が macOS（universal dmg/zip。Apple Silicon + Intel 両対応）・Windows（x64 / arm64 の nsis）・Linux（AppImage/deb/rpm/pacman）をビルドし、GitHub Releases へ公開します。Linux の対応: Ubuntu=`.deb` / AlmaLinux=`.rpm` / Arch=`pacman`（AppImage は全 distro 共通の保険）。現状のビルドは**未署名**です。

### 技術構成
- **シェル**: Electron（`electron/` の main / preload / protocol / security / menu / downloads）
- **レンダラ**: Vite + TypeScript + CodeMirror 6 + mermaid 11（`src/`）。本番は `app://` カスタムプロトコルで配信し、ES Modules と mermaid の動的 import を成立させます。
- **ビルド/配布**: electron-vite（main/preload/renderer）+ electron-builder（各OSパッケージ）

### ライセンス
本プロジェクトは **Apache License 2.0** のもとで公開されています（© 2026 4ltena）。詳細は [LICENSE](LICENSE) を参照してください。

---

## English

### What is it?
A Mermaid editing app that runs **fully local and offline**. Built with Electron + Vite + TypeScript: type your diagram code and it renders live in the preview pane. All rendering happens on-device with no network access.

### Key Features
- **Live preview** — debounced re-render as you type in the CodeMirror editor; syntax errors show in a panel while the last valid diagram is kept.
- **Dark / light aware** — the diagram theme follows the UI theme, switching to mermaid's `dark` theme (visible arrows/text) in dark mode (`default`/`dark`/`forest`/`neutral` can also be chosen manually).
- **Pan & zoom** — wheel zoom, drag to pan, fit-to-view.
- **Export** — export SVG / PNG / WebP from the Export dialog (auto scale or custom px×px with aspect lock); copy the source to the clipboard too.
- **Samples & persistence** — bundled samples for common diagram types; code, theme, and split width are auto-saved to `localStorage`.
- **Multilingual UI** — 11 languages (English / 日本語 / 繁體中文 / 简体中文 / 한국어 / Français / Español / Deutsch / Português / Italiano / Русский), switched via the header dropdown (initial language follows the OS; the choice is saved).
- **Fully local / offline** — mermaid and CodeMirror are bundled; no external CDN, fetch, or tracking.
- **Hardened** — strict CSP in production builds, `contextIsolation` / `sandbox` enabled, served over a custom `app://` protocol.

### Requirements
- macOS / Windows / Linux (Arch / AlmaLinux / Ubuntu)
- For development: Node 24

### Develop & Run
```bash
npm install
npm run dev        # launches the Electron app with HMR
```

Quality checks:
```bash
npm run typecheck  # type-checks the renderer + Electron main
npm test           # vitest (path-resolver + i18n unit tests)
npm run build      # electron-vite build -> out/
```

### Packaging (per OS)
Native apps can only be built on their own OS.
```bash
npm run dist:mac   # release/*-universal.dmg, *.zip   (run on macOS; Apple Silicon + Intel)
npm run dist:win   # release/*.exe (nsis)           (run on Windows)
npm run dist:linux # release/*.AppImage, *.deb, *.rpm, *.pacman (run on Linux)
```

### Release (CI/CD)
Releases are produced by GitHub Actions on a version tag.
```bash
# bump "version" in package.json to match, then:
git tag v0.1.0
git push origin v0.1.0
```
`.github/workflows/release.yml` builds macOS (universal dmg/zip — Apple Silicon + Intel), Windows (x64 and arm64 nsis), and Linux (AppImage/deb/rpm/pacman) and publishes them to GitHub Releases. Linux mapping: Ubuntu=`.deb` / AlmaLinux=`.rpm` / Arch=`pacman` (AppImage is the universal fallback). Builds are currently **unsigned**.

### Tech Stack
- **Shell**: Electron (`electron/` — main / preload / protocol / security / menu / downloads)
- **Renderer**: Vite + TypeScript + CodeMirror 6 + mermaid 11 (`src/`). In production it is served over a custom `app://` protocol so ES Modules and mermaid's dynamic imports work.
- **Build/Dist**: electron-vite (main/preload/renderer) + electron-builder (per-OS packages)

### License
This project is licensed under the **Apache License 2.0** (© 2026 4ltena). See the [LICENSE](LICENSE) file for details.
