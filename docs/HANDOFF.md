# HANDOFF（引き継ぎメモ） — mermaid-local-editor

> 会話履歴から抽出した引き継ぎメモ。2026-06-25時点。元の会話は本メモ作成後に削除予定。
> （注: 本リポジトリには README 等の設計ドキュメントが未整備のため、ここに会話で決まった事項をまとめる。）

## 概要（会話から見たこのプロジェクト）
- mermaid.live（https://mermaid.live/edit）のデスクトップ版に相当する、ローカルで動く Mermaid ダイアグラム描画/編集アプリ。Tauri v2 + Vite + TypeScript 構成（出典: Create local Mermaid diagram editor app）。
- UI コアは Web 技術（HTML/JS + mermaid.js）で1つ作り、各プラットフォーム用にラッパーで包む方針。将来のモバイル展開を見据えて「mobile-ready」を意識（出典: Create local Mermaid diagram editor app）。
- 機能セット: CodeMirror エディタ + ライブプレビュー（debounce）、エラーパネル、テーマ切替、pan/zoom、SVG/PNG エクスポート、localStorage 永続化、サンプル読み込み（出典: Create local Mermaid diagram editor app）。

## 既存ドキュメント未記載の設計・要件
- デスクトップラッパーは **Tauri v2** を採用（AskUserQuestion で選択）。Web コア再利用を最優先する判断（出典: Create local Mermaid diagram editor app）。
- 当初の開発は Windows 環境（D:\works\... / VS Community 2026 + MSVC + WebView2）。前提条件は Node 24 / npm 11 / Rust 1.96(rustup) / MSVC / WebView2 / git。Rust は当初未導入で `winget install Rustlang.Rustup` により後から導入（出典: Create local Mermaid diagram editor app）。
- 現在のリポジトリは macOS 側（/Users/kn/File/projects/Other/mermaid-local-editor）にチェックアウトされている（出典: Security review for Mermaid Local Editor）。
- 依存: mermaid ^11.4.1（render は `securityLevel: "strict"` + DOMPurify）、codemirror 6 系、@tauri-apps/cli ^2.2.5、vite ^6、typescript ^5.7（出典: package.json / Security review for Mermaid Local Editor）。
- ビルド: `npm run build` = `tsc --noEmit && vite build`。アプリ起動は `npm run tauri:dev` / `npm run tauri:build`。アイコンは `scripts/gen-icon.mjs` で生成し `npx tauri icon` で各プラットフォーム版を生成（出典: Create local Mermaid diagram editor app / package.json）。

## 現在の到達点
### 完成・動作中
- フロントエンドコアは type-check（`tsc --noEmit`）クリア、`vite build` で本番バンドル生成成功（Mermaid のサイズによる large-chunk 警告のみ）。ソース構成: `src/{main,editor,mermaid-render,export,samples}.ts` + `styles.css`、`index.html`（出典: Create local Mermaid diagram editor app）。
- Tauri ラッパー一式を作成: `src-tauri/{Cargo.toml,build.rs,tauri.conf.json}`、`src-tauri/src/{lib.rs,main.rs}`、`src-tauri/capabilities/default.json`、アイコン生成スクリプト（出典: Create local Mermaid diagram editor app）。

### 未完・途中
- 旧会話は `npx tauri icon` 実行の直後で凝縮が途切れており、`tauri dev`/`tauri build` の実機ビルド成否までは記録なし（出典: Create local Mermaid diagram editor app）。
- README（run/build 手順・モバイル拡張パス）の作成タスクが計画にあるが、リポジトリ上に未作成（出典: Create local Mermaid diagram editor app）。

## 次にやること（再開時TODO）
- macOS 上で `npm run tauri:dev` / `tauri:build` の動作確認（旧会話は Windows 環境のため）。
- README 作成（実行/ビルド手順とモバイル展開パス）。
- 下記セキュリティ指摘（CSP）の対応要否を判断。

## 注意点・ハマりどころ
- **CSP 未設定（セキュリティ指摘）**: `src-tauri/tauri.conf.json` で `"csp": null`。ユーザー入力の Mermaid ソースを `src/main.ts` の `els.canvas.innerHTML = svg` で DOM 描画し、localStorage に永続化して起動毎に自動再レンダリングする。mermaid の strict モード + DOMPurify でサニタイズされるが、DOMPurify/Mermaid プリサニタイザには過去 mXSS バイパスの CVE 実績（CVE-2024-49775, CVE-2025-54880 系の nested SVG/MathML）があり、CSP が無いとフォールバック防御が効かない（出典: Review Mermaid editor app for security vulnerabilities）。
- **opener 権限との合わせ技（同上の指摘の核）**: `src-tauri/capabilities/default.json` が `opener:default`（`plugin:opener|open_url` / `open_path`）をメインウィンドウに付与。サニタイザ・バイパスで webview に JS を通せれば `window.__TAURI_INTERNALS__.invoke('plugin:opener|open_url', ...)` 経由で外部アプリ/URL（Windows では `file://`/UNC/`vbscript:`）を起動できる恐れ。CSP 設定で緩和すべき hardening リグレッション（出典: Review Mermaid editor app for security vulnerabilities）。
- **その他は重大指摘なし**: localStorage→`style.flexBasis`（単一CSSプロパティ注入で実害なし）、PNG エクスポートの SVG→`<img>`→canvas（img 読み込み SVG は仕様上スクリプト実行不可、canvas は data: で汚染されない）、`scripts/gen-icon.mjs`（ビルド時・ユーザー入力なし）はいずれも高信頼度の独立脆弱性なしと判断（出典: Security review for Mermaid Local Editor）。
- セキュリティレビューの一方の会話は StructuredOutput がスキーマ不一致（`/findings: must be array`）でエラー終了。指摘内容自体は上記のとおり（出典: Security review for Mermaid Local Editor）。

## 出典会話（title / convid）
- Create local Mermaid diagram editor app / fc3019dc
- Review Mermaid editor app for security vulnerabilities / 6a7ca32d
- Security review for Mermaid Local Editor / 489d5307
