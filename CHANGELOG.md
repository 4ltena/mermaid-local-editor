# 変更履歴 / Changelog

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式に概ね従い、[セマンティックバージョニング](https://semver.org/lang/ja/) を採用しています。
This file roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-29

エディタの英語・日本語対応と、配布物（macOS universal / Windows arm64）の拡充。

### 追加
- 多言語UI（英語・日本語）。ヘッダーの `JA | EN` トグルで切替。初回は OS の言語に追従し、選択は localStorage に保存。UI 文言・ツールチップ・ステータス・サンプル名・ネイティブメニュー（独自ラベル）を翻訳。サンプル図のコードは日本語のまま。
- Windows arm64 ビルドを追加（`…-arm64.exe`）。Windows on ARM 向け。

### 変更
- macOS を universal 単一ビルドへ（Apple Silicon + Intel 両対応。従来は arm64 のみ）。
- リリースノートを CHANGELOG の抜き出し（日英併記）へ変更。
- ローカル作業用の `docs/superpowers/` を追跡対象外に。

### 検証
- 型検査・ユニットテスト（11件）・本番ビルドがすべて成功。

Editor localization (English/Japanese) and expanded distribution (macOS universal, Windows arm64).

### Added
- Bilingual UI (English/Japanese): a `JA | EN` toggle in the header. The initial language follows the OS and the choice is saved to localStorage. UI labels, tooltips, status messages, sample names, and the native menu (custom label) are translated; sample diagram code stays in Japanese.
- Windows arm64 build (`…-arm64.exe`) for Windows on ARM.

### Changed
- macOS is now a single universal build (Apple Silicon + Intel; previously arm64-only).
- Release notes are now a bilingual excerpt from the CHANGELOG.
- Stopped tracking the local-only `docs/superpowers/`.

### Verified
- Type-check, unit tests (11), and the production build all pass.

## [0.1.1] — 2026-06-29

サンプル選択ドロップダウンの表示を修正した版。

### 修正
- サンプルを選んだ後にドロップダウンが「— 選択 —」へ戻らず、読み込み中のサンプル名を表示し続けるようにした。以前は選択直後に選択値をリセットしていたため、どのサンプルを読み込んだか画面で確認できなかった。プレビューの描画は従来どおり動作する。

Fixes how the sample dropdown reflects the loaded sample.

### Fixed
- After picking a sample, the dropdown no longer resets to "— Select —" and keeps showing the loaded sample's name. Previously the value was cleared right after selection, so it was unclear which sample had been loaded. Diagram rendering is unchanged.

## [0.1.0] — 2026-06-29

デスクトップシェルを Tauri(Rust) から Electron(TypeScript) へ移行し、macOS / Windows / Linux（Arch / AlmaLinux / Ubuntu）対応のローカル Mermaid エディタとして整備した版。Web フロント（CodeMirror + mermaid）は再利用。

### 追加
- Electron シェル（main プロセス）。本番は独自 `app://` カスタムプロトコルでビルド済みレンダラを配信し、ES Modules と mermaid の動的 import（図種の遅延ロード）を完全オフラインで実行。
- セキュリティハードニング。本番ビルドへの厳格な CSP（`worker-src` 含む）、`contextIsolation` / `nodeIntegration:false` / `sandbox` を有効化。
- アプリメニュー（コピー・貼り付け・終了・ズーム等の標準ショートカット）と、SVG / PNG エクスポートの保存ダイアログ連携（`will-download`）。
- ダーク/ライト連動。UI テーマの切替に図テーマを連動させ、ダーク時は矢印・文字が見える mermaid `dark` テーマへ自動切替（ドロップダウンでの手動上書きも可）。
- 配色をミュートインディゴ基調へ変更（accent: light `#6366a8` / dark `#9a9de0`）。アプリアイコンも同系で生成。
- パッケージング。electron-builder による各OSターゲット（mac: dmg/zip、win: nsis、linux: AppImage/deb/rpm/pacman）。
- CI/CD。`v*` タグで GitHub Actions が全OSをビルドし GitHub Releases へ公開するリリースワークフローと、push / PR 時の型・テスト・ビルドチェック。
- テスト。レンダラのパス解決ユニットテスト（ディレクトリトラバーサル、クエリ・フラグメント、不正パーセントエンコードのガードを検証。vitest）。

### 変更
- デスクトップシェルを Tauri(Rust) から Electron(TypeScript) へ置換し、保守する言語を TypeScript に集約。
- 開発/本番の読み込みを electron-vite に統一（開発は `ELECTRON_RENDERER_URL`、本番は埋め込みレンダラを `app://` で読み込み）。

### 削除
- Tauri / Rust 一式（`src-tauri/`）と opener プラグイン。

### 検証
- 型検査・ユニットテスト（7件）・本番ビルドがすべて成功。
- macOS の `.app` を実起動し、描画・新配色・ダーク時の矢印表示・エクスポートを確認。

### 備考
- 現状ビルドは未署名（mac は Gatekeeper、win は SmartScreen の確認が出る場合あり）。
- Linux の rpm / pacman は CI（Linux ランナー）で生成。AppImage は全 distro 共通の保険。

Migrated the desktop shell from Tauri (Rust) to Electron (TypeScript), shaping it into a local Mermaid editor for macOS / Windows / Linux (Arch / AlmaLinux / Ubuntu). The web front end (CodeMirror + mermaid) is reused.

### Added
- Electron shell (main process). In production a custom `app://` protocol serves the built renderer so ES Modules and mermaid's dynamic imports (lazy-loaded diagram types) run fully offline.
- Security hardening: a strict CSP (including `worker-src`) on production builds; `contextIsolation` / `nodeIntegration:false` / `sandbox` enabled.
- Application menu (standard copy/paste/quit/zoom shortcuts) and a save dialog for SVG / PNG export (`will-download`).
- Dark/light coupling: the diagram theme follows the UI theme; in dark mode it switches to mermaid's `dark` theme (visible arrows/text), with manual override via the dropdown.
- Accent color changed to muted indigo (accent: light `#6366a8` / dark `#9a9de0`); the app icon matches.
- Packaging: per-OS electron-builder targets (mac: dmg/zip, win: nsis, linux: AppImage/deb/rpm/pacman).
- CI/CD: a release workflow that builds every OS on `v*` tags and publishes to GitHub Releases, plus type/test/build checks on push / PR.
- Tests: a renderer path-resolver unit test (guards against directory traversal, query/fragment, and malformed percent-encoding; vitest).

### Changed
- Replaced the desktop shell Tauri (Rust) with Electron (TypeScript), consolidating the maintained language to TypeScript.
- Unified dev/production loading on electron-vite (dev via `ELECTRON_RENDERER_URL`, production loading the embedded renderer over `app://`).

### Removed
- The entire Tauri / Rust setup (`src-tauri/`) and the opener plugin.

### Verified
- Type-check, unit tests (7), and the production build all pass.
- Launched the macOS `.app` and confirmed rendering, the new accent, dark-mode arrow visibility, and export.

### Notes
- Builds are currently unsigned (macOS Gatekeeper / Windows SmartScreen prompts may appear).
- Linux rpm / pacman are produced in CI (Linux runner); AppImage is the universal fallback.
