# Replit → Vercel 移植 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replit/Streamlit 配信をやめ、React+Vite SPA を Vercel が直接ビルド・静的配信する構成へ移植する。

**Architecture:** アプリは完全クライアントサイドの Vite SPA。Streamlit/Python ラッパーは機能を持たないため撤去し、Vercel に `vite build` → `dist/` 配信させる。バックエンドなし。

**Tech Stack:** React 19, Vite 7, TypeScript, Vercel(静的ホスティング + GitHub 連携)。

## Global Constraints

- 作業ブランチ: `claude/superpower-integration-getav9`。push は `git push -u origin claude/superpower-integration-getav9`。
- git committer は `Claude <noreply@anthropic.com>`(設定済み)。
- 各コミットメッセージ末尾に以下のトレーラを付与:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_011tNWnQP1vkkzWsHiYDie8j
  ```
- `dist/` と `node_modules/` は `.gitignore` 済み。`dist/` はコミットしない(Vercel がビルド)。
- 仕様書: `docs/superpowers/specs/2026-06-21-vercel-migration-design.md`。

---

### Task 1: Vercel ビルド設定(package.json scripts + vercel.json)

**Files:**
- Modify: `package.json`(`scripts` セクション)
- Create: `vercel.json`

**Interfaces:**
- Produces: `npm run build` が `vite build` を実行し `dist/` を生成。`vercel.json` が framework=vite を明示。

- [ ] **Step 1: `package.json` の scripts を更新**

現状:
```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```
変更後:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
```

- [ ] **Step 2: `vercel.json` を新規作成**

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

- [ ] **Step 3: ビルドが通ることを確認**

Run: `npm run build`
Expected: `✓ built in ...` で成功。`dist/index.html` と `dist/assets/index-*.js` / `index-*.css` が生成される。

- [ ] **Step 4: Commit**

```bash
git add package.json vercel.json
git commit -m "Add Vite build scripts and Vercel config"
```

---

### Task 2: 未使用フロントエンド資産の除去(next 依存 + public svg)

**Files:**
- Modify: `package.json`(`dependencies` から `next` を削除)
- Modify: `package-lock.json`(`npm install` で再生成)
- Delete: `public/file.svg`, `public/flow-diagram.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

**Interfaces:**
- Consumes: Task 1 の `npm run build`。
- Produces: Next.js 誤検出の元( `next` 依存)と未参照 svg が消えた状態。

- [ ] **Step 1: `next` がコードで未使用であることを再確認**

Run: `grep -rn "from 'next\|from \"next\|require('next" src`
Expected: 出力なし(未使用)。

- [ ] **Step 2: `package.json` の dependencies から `next` 行を削除**

削除する行:
```json
    "next": "^16.1.6",
```

- [ ] **Step 3: lockfile を更新**

Run: `npm install --no-audit --no-fund`
Expected: エラーなく完了。`package-lock.json` から next 関連が減る。

- [ ] **Step 4: 未参照 svg を削除**

Run:
```bash
git rm public/file.svg public/flow-diagram.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```
Expected: 6 ファイルが削除ステージされる。

- [ ] **Step 5: ビルドが引き続き通ることを確認**

Run: `npm run build`
Expected: `✓ built in ...` で成功(エラー・警告増加なし)。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "Remove unused next dependency and stale public svgs"
```

---

### Task 3: Streamlit/Replit/Python ファイルの撤去 + 追跡済み dist の untrack

**Files:**
- Delete: `app.py`, `.replit`, `.streamlit/`, `pyproject.toml`, `uv.lock`
- Untrack: `dist/`(`.gitignore` 済み)

**Interfaces:**
- Consumes: Task 1/2 完了後の状態。
- Produces: Python/Streamlit/Replit 依存ゼロ、`dist/` 非追跡のクリーンなリポジトリ。

- [ ] **Step 1: Streamlit/Replit/Python 一式を削除**

Run:
```bash
git rm app.py .replit pyproject.toml uv.lock
git rm -r .streamlit
```
Expected: 各ファイル/ディレクトリが削除ステージされる。

- [ ] **Step 2: 追跡されたまま残る `dist/` を untrack**

Run: `git rm -r --cached dist`
Expected: `dist/index.html` など 7 ファイルがインデックスから外れる(作業ツリーのファイルは残る)。

- [ ] **Step 3: 残存する Python/Streamlit/Replit 参照がないか確認**

Run: `grep -rIn "streamlit\|replit\|\.streamlit" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs`
Expected: 実体のある参照は出ない(README/blog 内の文章表現が残る場合は許容。設定・コードからの依存がないことを確認)。

- [ ] **Step 4: クリーンビルドが通ることを確認**

Run: `rm -rf dist && npm run build`
Expected: `✓ built in ...` で成功し `dist/` が再生成される。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove Streamlit/Replit/Python files and untrack dist"
```

---

### Task 4: ローカル最終検証 + push

**Files:** なし(検証とデプロイ)

**Interfaces:**
- Consumes: Task 1-3 完了後のリポジトリ。
- Produces: origin の作業ブランチに反映済みの移植版。

- [ ] **Step 1: クリーンビルド**

Run: `rm -rf dist && npm run build`
Expected: 成功。`dist/index.html` + `dist/assets/*` 生成。

- [ ] **Step 2: プレビューでアプリ動作確認**

Run: `npx vite preview --port 4173` をバックグラウンド起動し、`curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/` で `200` を確認。さらに `curl -s http://localhost:4173/ | grep -c 'id="root"'` で `1`(SPA マウントポイント存在)を確認。終わったらプレビュープロセスを停止。
Expected: HTTP 200、`id="root"` 検出。

- [ ] **Step 3: git status がクリーンか確認**

Run: `git status --short`
Expected: 出力なし(全変更コミット済み、`dist/` は ignore 済み)。

- [ ] **Step 4: push**

Run: `git push -u origin claude/superpower-integration-getav9`
（ネットワークエラー時のみ 2s/4s/8s/16s で最大4回リトライ）
Expected: push 成功。

---

### Task 5: Vercel GitHub 連携 手順書(ユーザー操作)

**Files:**
- Create: `docs/superpowers/vercel-deploy.md`(ユーザー向け接続手順)

**Interfaces:**
- Consumes: push 済みのブランチ。
- Produces: ユーザーが Vercel ダッシュボードで実施する接続手順の記録。

- [ ] **Step 1: 手順書を作成**

`docs/superpowers/vercel-deploy.md` に以下を記載:
```markdown
# Vercel デプロイ手順(GitHub 連携)

1. https://vercel.com にログイン(GitHub アカウントで可)。
2. "Add New… → Project" → GitHub の `GinYoshida/Fiscal-Outlook-Sim` を Import。
   - 初回は Vercel GitHub App にリポジトリへのアクセス許可が必要。
3. Configure Project 画面:
   - Framework Preset: **Vite**(`vercel.json` で固定済みのため自動でこうなる)
   - Build Command: `npm run build`(自動)
   - Output Directory: `dist`(自動)
   - Environment Variables: 不要(このアプリは環境変数を使わない)
4. 初回は確認のためブランチ `claude/superpower-integration-getav9` を選んで Deploy し、
   発行されるプレビュー URL でアプリの表示・操作・コンソールエラー無しを確認。
5. 問題なければ `main` にマージ。以後:
   - `main` への push → 本番デプロイ
   - 各 PR → プレビュー URL を自動生成
6. (任意)カスタムドメインは Vercel の Project → Settings → Domains から追加。
```

- [ ] **Step 2: Commit & push**

```bash
git add docs/superpowers/vercel-deploy.md
git commit -m "Add Vercel deployment guide"
git push -u origin claude/superpower-integration-getav9
```

---

## Self-Review

- **Spec coverage:** 目標アーキテクチャ(Task 1)、scripts/vercel.json 追加(Task 1)、next 除去 + 未使用 svg 削除(Task 2)、Streamlit/Replit/Python 削除 + dist untrack(Task 3)、ローカル/Vercel 検証(Task 4 + Task 5 手順)、GitHub 連携(Task 5)— 仕様書の全項目を網羅。
- **Placeholder scan:** TBD/TODO なし。各ステップに実コマンド・実内容を記載。
- **Type consistency:** コード型の依存関係なし(設定・ファイル操作のみ)。`npm run build` / `dist` / `vercel.json` の参照は全タスクで一貫。
- スコープ外(パスワード保護、カスタムドメイン強制、babel/playwright 整理、バンドル分割)は計画に含めない。
