# Replit (Streamlit) → Vercel 移植 設計書

- 日付: 2026-06-21
- 対象リポジトリ: GinYoshida/Fiscal-Outlook-Sim
- 作業ブランチ: `claude/superpower-integration-getav9`

## 背景

現状、アプリ本体は React + Vite 製のクライアントサイド SPA(`src/` → `dist/`)。
Replit 上では `app.py` の Streamlit ラッパーがビルド済み HTML/CSS/JS を Streamlit
コンポーネントとして埋め込み配信している。Streamlit は「Replit で静的 React を配るための
ラッパー」でしかなく、機能的な役割を持たない。

調査で確認した事実:
- `src/` に `fetch` / API / バックエンド呼び出しは皆無(`constants.ts` の URL は画面表示用の
  参考リンクで通信しない)。`import.meta.env` 等の環境変数依存もなし。完全にクライアント
  サイドのみ。
- `npx vite build` はクリーンに成功。出力は `dist/index.html` + `dist/assets/index-*.css`
  + `index-*.js`(JS 約 837KB)。アセットは `/assets/...` の絶対パス参照。
- `package.json` の dependencies に未使用の `next`(Next.js)が混入。Vercel のフレームワーク
  自動判定で Next.js と誤検出されるリスクがある。
- `public/` の svg 6 個(`file/flow-diagram/globe/next/vercel/window.svg`)はコードからも
  ブログからも未参照の残骸。`public/blog/*.png` はブログ用画像。
- `.gitignore` は `dist/` `node_modules/` を無視済みだが、`dist/` 配下 7 ファイルが過去に
  追跡されたまま残存。

## 目標アーキテクチャ

純粋な静的 SPA を Vercel が配信する。Python / Streamlit / Serverless は一切使わない。
Vercel が `vite build` を実行し、`dist/` を CDN 配信するのみ。バックエンドは元々存在しない
ため不要。

## リポジトリ変更

### 追加・変更

1. `package.json` に scripts を追加:
   - `"dev": "vite"`
   - `"build": "vite build"`
   - `"preview": "vite preview"`
2. `vercel.json` を新規作成し、フレームワークを Vite に固定(Next.js 誤検出を防止):
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist"
   }
   ```
   この SPA は単一 `index.html` + URL クエリパラメータ方式(パスルーティングなし)のため、
   SPA rewrite は不要。

### 削除

1. Streamlit / Replit / Python 一式:
   - `app.py`
   - `.replit`
   - `.streamlit/`
   - `pyproject.toml`
   - `uv.lock`
2. `package.json` の `next` 依存(誤検出の元)。
3. `public/` の未使用 svg 6 個(`file.svg` `flow-diagram.svg` `globe.svg` `next.svg`
   `vercel.svg` `window.svg`)。
4. 追跡されたまま残る `dist/` 配下のファイルを untrack(`git rm -r --cached dist`)。
   `.gitignore` で無視済みのため、以後は Vercel 側でビルド。

### 保持

- `public/blog/*.png`(ブログ用画像)。
- `babel` / `playwright` 依存(今回は整理しない。スコープ外)。

## デプロイフロー(GitHub 連携)

1. リポジトリ側の設定ファイル整備(上記変更)を作業ブランチ
   `claude/superpower-integration-getav9` に push。
2. Vercel ダッシュボードでの「Import Project / GitHub 接続」手順は手順書として提示
   (Vercel アカウント操作はエージェント環境からは実行不可)。
3. 接続後の挙動:
   - `main` への push → 本番デプロイ
   - PR ごとにプレビュー URL を自動生成

## 検証

- **ローカル**:
  - `npm run build` が成功する。
  - `npx vite preview` でアプリが正常表示・操作できる。
- **Vercel**:
  - プレビューデプロイでアプリが表示される。
  - シミュレーターが操作できる(タブ切替、スライダー、グラフ描画)。
  - ブラウザコンソールにエラーがない。
  - アセットパス(`/assets/...`)が解決される。

## スコープ外(非目標)

- パスワード保護(別件)。
- カスタムドメイン(後で Vercel 管理画面から追加可能)。
- バックエンド導入(不要)。
- `babel` / `playwright` 依存の整理。
- JS バンドルのコード分割によるサイズ最適化(動作には影響しないため今回は対象外)。
