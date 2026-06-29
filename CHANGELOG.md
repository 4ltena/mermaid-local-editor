# 変更履歴

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式に概ね従い、
[セマンティックバージョニング](https://semver.org/lang/ja/) を採用しています。

## [0.1.1] — 現行

サンプル選択ドロップダウンの表示を修正した版。

### 修正
- サンプルを選んだ後にドロップダウンが「— 選択 —」へ戻らず、読み込み中のサンプル名を
  表示し続けるようにした。以前は選択直後に選択値をリセットしていたため、どのサンプルを
  読み込んだか画面で確認できなかった。プレビューの描画は従来どおり動作する。

## [0.1.0] — 2026-06-29

デスクトップシェルを Tauri(Rust) から Electron(TypeScript) へ移行し、
macOS / Windows / Linux（Arch / AlmaLinux / Ubuntu）対応のローカル Mermaid
エディタとして整備した版。Web フロント（CodeMirror + mermaid）は再利用。

### 追加
- **Electron シェル**（main プロセス）。本番は独自 `app://` カスタムプロトコルで
  ビルド済みレンダラを配信し、ES Modules と mermaid の動的 import（図種の遅延ロード）を
  **完全オフライン**で実行。
- **セキュリティハードニング**: 本番ビルドへの厳格な CSP（`worker-src` 含む）、
  `contextIsolation` / `nodeIntegration:false` / `sandbox` を有効化。
- **アプリメニュー**（コピー/貼り付け/終了/ズーム等の標準ショートカット）と、
  SVG / PNG エクスポートの**保存ダイアログ**連携（`will-download`）。
- **ダーク/ライト連動**: UI テーマの切替に図テーマを連動させ、ダーク時は矢印・文字が
  見える mermaid `dark` テーマへ自動切替（ドロップダウンでの手動上書きも可）。
- **配色**: ミュートインディゴ基調へ変更（accent: light `#6366a8` / dark `#9a9de0`）。
  アプリアイコンも同系で生成。
- **パッケージング**: electron-builder による各OSターゲット
  （mac: dmg/zip、win: nsis、linux: AppImage/deb/rpm/pacman）。
- **CI/CD**: `v*` タグで GitHub Actions が全OSをビルドし GitHub Releases へ公開する
  リリースワークフローと、push / PR 時の型・テスト・ビルドチェック。
- **テスト**: レンダラのパス解決ユニットテスト（ディレクトリトラバーサル /
  クエリ・フラグメント / 不正パーセントエンコードのガードを検証、vitest）。

### 変更
- デスクトップシェルを **Tauri(Rust) → Electron(TypeScript)** へ置換し、保守する
  言語を TypeScript に集約。
- 開発/本番の読み込みを electron-vite に統一（開発は `ELECTRON_RENDERER_URL`、
  本番は埋め込みレンダラを `app://` で読み込み）。

### 削除
- Tauri / Rust 一式（`src-tauri/`）と opener プラグイン。

### 検証
- 型検査・ユニットテスト（7件）・本番ビルドがすべて成功。
- macOS の `.app` を実起動し、描画・新配色・ダーク時の矢印表示・エクスポートを確認。

### 備考
- 現状ビルドは**未署名**（mac は Gatekeeper、win は SmartScreen の確認が出る場合あり）。
- Linux の rpm / pacman は CI（Linux ランナー）で生成。AppImage は全 distro 共通の保険。
