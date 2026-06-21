# Vercel デプロイ手順(GitHub 連携)

このアプリは React + Vite の静的 SPA です。Vercel が `npm run build` を実行し
`dist/` を配信します(`vercel.json` で設定済み)。バックエンド・環境変数は不要です。

## 初回セットアップ

1. https://vercel.com にログイン(GitHub アカウントで可)。
2. **Add New… → Project** → GitHub の `GinYoshida/Fiscal-Outlook-Sim` を Import。
   - 初回は Vercel の GitHub App にリポジトリへのアクセス許可が必要です。
3. **Configure Project** 画面(`vercel.json` があるため、基本は自動入力されます):
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`(自動)
   - Environment Variables: **不要**(このアプリは環境変数を使いません)
4. まず確認用に、ブランチ `claude/superpower-integration-getav9` を選んで **Deploy**。
   発行されるプレビュー URL で以下を確認:
   - アプリが表示される
   - シミュレーターが操作できる(タブ切替、スライダー、グラフ描画)
   - ブラウザのコンソールにエラーがない

## 本番運用

5. プレビューで問題なければ `claude/superpower-integration-getav9` を `main` にマージ。
   以降の挙動:
   - `main` への push → **本番デプロイ**
   - 各 Pull Request → **プレビュー URL** を自動生成
6. (任意)独自ドメインは Vercel の **Project → Settings → Domains** から追加。

## ローカルでの確認コマンド

```bash
npm install
npm run build      # dist/ を生成
npm run preview    # ローカルでビルド結果を配信(http://localhost:4173)
npm run dev        # 開発サーバ(http://localhost:5000)
```

## 補足

- `dist/` は `.gitignore` 済みで、Vercel 側でビルドされます(リポジトリにはコミットしません)。
- Replit/Streamlit/Python 関連ファイルは移植時に削除済みです。
