# 設計書: Electron への移行とクロスプラットフォーム配布 + 配色変更

> 作成日: 2026-06-25 / ステータス: 承認済み（実装計画へ移行）
> 対象リポジトリ: mermaid-local-editor

## 1. 背景・現在地

- 本アプリは mermaid.live のデスクトップ版に相当する、完全ローカルで動く Mermaid 編集/描画アプリ。
- 現状の実装: **Vite + TypeScript のフロント（CodeMirror エディタ + mermaid 描画）** を **Tauri v2（Rust シェル）** で包む構成。
- macOS 上で `.app`（release）のビルド・起動・プロセス常駐までは確認済み（`.dmg` は Tauri の `bundle_dmg.sh` で失敗）。
- フロントは完全オフライン（mermaid・CodeMirror をバンドル、外部 CDN/fetch なし、フォントはシステム）であることを監査で確認済み。

## 2. 目的・非目的

### 目的
1. **保守する言語を減らす**（フロントもシェルも同一言語に集約したい）。
2. **macOS に加え Windows・Linux（Arch / AlmaLinux / Ubuntu）版を用意する**。
3. **配色を落ち着いた色にする**（現状の鮮やかな紫を抑える）。
4. macOS 版はローカルで実起動してテストする。

### 非目的（今回スコープ外）
- コード署名 / 公証（mac notarization, Windows signing）— 証明書が必要なため初期は未署名。
- iOS / Android などモバイル展開。
- mermaid 自体の機能拡張。

## 3. 決定事項

| 項目 | 決定 | 理由 |
|---|---|---|
| シェル | **Electron（TS/JS）** に移行、Tauri/Rust は撤廃 | 言語を TS/JS 1つに集約でき、全OSパッケージングが最成熟。「言語を減らす」と「全OS対応」を同時達成 |
| 「コアを C 化」 | **不採用** | 描画コア = mermaid は JS 製で C 化は非現実的。シェルの C 化は3OS分の WebView/保存ダイアログ/配布を手書きとなり「保守を楽に」と矛盾 |
| ビルドツール | レンダラ/メイン/preload を **electron-vite**、配布を **electron-builder** | 設定一元化と全形式パッケージ生成 |
| 配色 | accent を **ミュートインディゴ**（light `#6366a8` / dark `#9a9de0`） | 紫のブランド連続性を保ちつつ彩度を抑える |
| ビルド/リリース体制 | **GitHub Actions の CI/CD で全OSのネイティブアプリをビルドし、GitHub Releases へ自動リリース**。ローカルは macOS のみ実ビルド | ネイティブ依存のため Mac 単独で全OSは作れない。配布は CI/CD に一本化 |

## 4. アーキテクチャ

```
┌──────────────────────────────────────────────┐
│ Electron Main Process (electron/main.ts, TS)  │
│  - BrowserWindow 生成（1280x800, min 640x480） │
│  - app:// カスタムプロトコルで dist/ を配信     │
│  - session.will-download → 保存ダイアログ       │
│  - Application Menu（標準ロール）               │
│  - dev: http://localhost:1420 / prod: app://   │
└───────────────┬──────────────────────────────┘
                │ loads
┌───────────────▼──────────────────────────────┐
│ Renderer (既存 src/ をそのまま, TS/JS)         │
│  index.html + main.ts + editor/mermaid-render/ │
│  export/samples + styles.css                   │
│  CodeMirror 6 / mermaid 11（バンドル, オフライン）│
└──────────────────────────────────────────────┘
   preload.ts（contextIsolation 用, 最小）
```

- **コンポーネント境界**:
  - `electron/main.ts`: ウィンドウとライフサイクル、プロトコル登録、ダウンロード処理、メニュー組み立てのオーケストレーション（各責務は下記モジュールへ委譲）。
  - `electron/protocol.ts`: `app://` の `protocol.handle` 実装（ビルド済みレンダラ配下のファイルを MIME 付きで返す）。出力先は electron-vite 既定の `out/renderer`。
  - `electron/menu.ts`: 標準ロールの Menu 定義。
  - `electron/preload.ts`: `contextBridge` 用の最小スクリプト（現状は実質空。将来のネイティブ橋渡し拡張点）。
  - レンダラ（`src/`）: 既存のまま。アプリロジックは引き続き JS 側に集約。

## 5. レンダラ読み込み & セキュリティ

- 自作スキーム **`app://`** を `protocol.registerSchemesAsPrivileged` で `{ standard:true, secure:true, supportFetchAPI:true, stream:true }` 登録し、ビルド済みレンダラ（`out/renderer`）を配信 → ESM・動的 import（mermaid の図種遅延ロード）・`fetch`・secure context（`navigator.clipboard` 可）が成立。`file://` は ESM/動的 import がブロックされるため不採用。
- `BrowserWindow` webPreferences: **`contextIsolation: true` / `nodeIntegration: false` / `sandbox: true`**。
- **CSP** をレスポンスヘッダ（または index.html の meta）で付与。初期値（mermaid 実態に合わせ調整）:
  - `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'`
  - 注: mermaid/CodeMirror は実行時にインラインスタイルを多用するため `style-src 'unsafe-inline'` が必要。`script-src` は `'self'` のみ（インラインスクリプトなし）を維持。実装時に実際の描画で違反が出ないか検証し最小限に調整。
- Tauri の `opener` プラグイン権限は撤廃 → 旧 HANDOFF が指摘した「CSP 無し + opener」hardening リグレッションを解消。

## 6. ネイティブ連携（フロントは極力無改変）

- **エクスポート（SVG/PNG）**: 既存 `src/export.ts` の `<a download>`(Blob URL) はそのまま。Electron 側 `session.defaultSession.on('will-download', ...)` で受け、`item.setSaveDialogOptions({ defaultPath: item.getFilename() })` を設定して保存ダイアログを表示。`export.ts` は無改変。
- **コピー**: `app://` が secure context のため `navigator.clipboard.writeText` がそのまま動作。フロント無改変。
- **メニュー/ショートカット**: 標準ロール（`appMenu`(mac)/`editMenu`/`viewMenu`(zoom,reload は dev のみ)/`windowMenu`）。Cmd/Ctrl+C/V/X/A・Cmd+Q が有効になり、CodeMirror 編集とコピーが期待通り動く。
- **ウィンドウ**: title「Mermaid Local Editor」, 1280x800, min 640x480, resizable, backgroundColor を UI テーマに合わせて設定（白ちらつき防止）。

## 7. 開発 vs 本番

- `app.isPackaged` で分岐。
  - 開発: `vite dev`（`http://localhost:1420`, HMR）を読み込み。
  - 本番: 埋め込みレンダラ（`out/renderer`）を `app://./index.html` で読み込み。
- electron-vite が main/preload/renderer のビルドと dev オーケストレーション（vite dev + electron 起動 + HMR）を担当。

## 8. プロジェクト構成の変更

### 削除
- `src-tauri/` 一式（`Cargo.toml`, `build.rs`, `tauri.conf.json`, `src/{lib,main}.rs`, `capabilities/`, 生成 `icons/`, `gen/`, `target/`）。
- `scripts/gen-icon.mjs` は色変更のうえアイコン生成に流用可（または electron-builder 用に簡素化）。

### 追加
- `electron/main.ts`, `electron/protocol.ts`, `electron/menu.ts`, `electron/preload.ts`
- `electron.vite.config.ts`
- `electron-builder.yml`
- `build/`（アイコン: `icon.icns`(mac) / `icon.ico`(win) / `icon.png`(linux, 512px)）
- `.github/workflows/release.yml`（CI/CD リリース用マトリクス、タグ駆動で GitHub Releases へ自動公開）＋任意で `.github/workflows/ci.yml`（PR/push 時の型・ビルドチェック）

### 維持
- `src/`・`index.html`・`tsconfig.json`。`vite.config.ts` の設定は `electron.vite.config.ts` の renderer セクションへ統合。
- `package.json`: `dependencies` から mermaid/codemirror を維持。`devDependencies` に `electron`, `electron-vite`, `electron-builder` を追加、`@tauri-apps/cli` を削除。scripts を再編:
  - `dev`: `electron-vite dev`
  - `build`: `electron-vite build`
  - `dist:mac` / `dist:win` / `dist:linux`: `electron-builder --mac|--win|--linux`
  - `dist`: 現OS向け一括

## 9. クロスプラットフォーム・パッケージング（electron-builder）

| OS | 形式 | 対象/distro |
|---|---|---|
| macOS | `dmg` + `zip`（arm64; 必要なら x64/universal） | この Mac |
| Windows | `nsis`(.exe インストーラ) | Windows 10/11 |
| Linux | `AppImage` + `deb` + `rpm` + `pacman` | **Ubuntu=.deb / AlmaLinux=.rpm / Arch=pacman**、AppImage は3distro共通の保険 |

- electron-builder は `pacman`/`rpm`/`deb`/`AppImage` をネイティブにサポート。Arch は将来 AUR（PKGBUILD）も追加余地。

## 10. ビルド & リリース計画（本設計の中核）

- **現実**: ネイティブ desktop アプリは Mac から Win/Linux を丸ごとビルドできない。標準解は CI マトリクス。**配布は GitHub CI/CD に一本化**する。
- **体制**:
  1. **ローカル(この Mac)**: 開発と macOS 版の実ビルド＆実起動テストのみ（Electron は npm 依存のみ、Rust/Xcode 不要）。ローカルは検証用で、配布物の正は CI が生成する。
  2. **CI/CD（GitHub Actions, `.github/workflows/release.yml`）でリリース**:
     - **トリガ**: `v*` タグ push（例 `v0.1.0`）。手動 `workflow_dispatch` も用意。
     - **マトリクス build ジョブ**:
       - `macos-latest` → `dmg` + `zip`（arm64; 必要なら x64/universal も）
       - `windows-latest` → `nsis`(.exe)
       - `ubuntu-latest` → `AppImage` + `deb` + `rpm` + `pacman`
     - **リリース手段**: 各ジョブで electron-builder を `--publish always`（`publish: github` プロバイダ）で実行し、生成物を **GitHub Releases（タグに対応）へ自動アップロード**。あるいは各ジョブで artifact 化 → 集約ジョブが `softprops/action-gh-release` で1つの Release にまとめて添付。いずれかを実装時に確定（既定は electron-builder の `--publish`）。
     - **バージョン**: `package.json` の `version` を正とし、タグと一致させる（タグ駆動）。
     - **権限**: `GITHUB_TOKEN`（`contents: write`）で Release 作成。追加シークレット不要（署名は当面なし）。
  3. **CI 検証（任意の追加ジョブ）**: `electron-vite build` と `tsc --noEmit` を PR/push でも実行。Linux は AppImage を Docker(+xvfb) でヘッドレス起動スモーク可。
- 署名は初期未対応（mac は Gatekeeper、win は SmartScreen の確認が出る前提。ローカル/配布初期は許容）。将来、証明書入手後に notarization/signing を同 CI に追加。

## 11. 配色変更

- `src/styles.css`:
  - light: `--accent: #6366a8`（旧 `#7b3fe4`）。`--accent-text: #ffffff`（白文字、コントラスト十分）。
  - dark: `--accent: #9a9de0`（旧 `#a06bff`）。`--accent-text: #1a1b22`（暗文字でコントラスト確保）。
  - 他（`--bg`/`--bg-soft`/`--border`/`--text`/エラー色）は据え置き。
- アプリアイコン: 背景紫 `#7b3fe4` → `#6366a8` 系へ（`gen-icon.mjs` の `BG` 変更、または build/ のアイコンを差し替え）。
- accent 使用箇所（brand 文字, 主要ボタン, hover ボーダー, gutter hover）に自動反映。

## 12. テスト/検証

- フロント: 既存 `tsc --noEmit` + renderer ビルド成功。
- Electron: `electron-vite build` の成功（main/preload/renderer の型・バンドル）。
- macOS 実起動: パッケージ済み `.app` を起動しプロセス常駐確認。可能なら `vite preview` 相当をブラウザで開き、Mermaid 描画と新配色を目視（スクリーンショットは画面収録権限が必要なため、未付与時は手動確認を案内）。
- Win/Linux: CI artifact 生成を以て一次確認。AppImage を Docker(+xvfb) でヘッドレス起動スモーク（任意）。

## 13. リスクと緩和

| リスク | 緩和 |
|---|---|
| バンドル肥大(~150–200MB/OS)・RAM 増 | Electron の本質コスト。許容（デスクトップ用途）。不要 locale 除去等で微減可 |
| 未署名による OS 警告（Gatekeeper/SmartScreen） | 初期は許容。将来、証明書入手後に署名/公証を CI へ追加 |
| Win/Linux の最終確認が Mac 単独で完結しない | CI マトリクス + Docker/VM スモークで担保 |
| CSP 厳格化で mermaid 描画が壊れる可能性 | 実描画で違反検証し、`style-src 'unsafe-inline'` 等を最小限で許可 |
| blob ダウンロードの保存ダイアログ挙動差 | `will-download` + `setSaveDialogOptions` で明示制御し各OSで確認 |

## 14. 削除されるもの

- Tauri/Rust シェル一式、opener プラグイン、`@tauri-apps/cli` 依存、Tauri 用アイコン生成物。

## 15. 未解決/将来

- コード署名・公証（証明書入手後）。
- Arch 向け AUR(PKGBUILD)。
- 自動更新（electron-updater）— 今回は対象外。
