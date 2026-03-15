# 資産管理システム

銀行・証券口座を自動連携し、純資産の推移を可視化する次世代型資産管理アプリ。
**Vercel + Supabase** で完結するシンプル構成。Rust バックグラウンドジョブが残高を自動同期する。

---

## アーキテクチャ

```
ブラウザ
  └─ Next.js (Vercel)
       ├─ フロントエンド (App Router + Recharts)
       └─ API Routes /api/v1/...   ── 認証・CRUD・集計
            └─ Supabase PostgreSQL (RLS + 監査ログ)

Rust/Axum (Railway / Fly.io)
  └─ バックグラウンド同期ジョブ
       ├─ TBL_ACCTS の state='sync' を30分ごとに検知
       ├─ fetch_balance() → 金融機関 API (現在: モック)
       ├─ TBL_BALAN に残高を UPSERT
       └─ TBL_SYNCL に実行ログを記録
```

---

## DB 規約

| 規約 | 詳細 |
|------|------|
| テーブル名 | `TBL_` で始まる **9文字固定** |
| カラム名 | 小文字 **5文字固定**、アンダースコア不使用 |

```
TBL_USERS : objid  email  roles  ctime
TBL_CATEG : objid  ownid  cname  ctype  ctime
TBL_TRANS : objid  ownid  catid  amnts  dates  ctime
TBL_AUDIT : objid  ownid  actio  ctime
TBL_ASSET : objid  ownid  aname  atype  ctime
TBL_BALAN : objid  ownid  astid  amnts  dates  ctime
TBL_ACCTS : objid  ownid  astid  iname  itype  state  lsync  ctime
TBL_SYNCL : objid  ownid  accid  state  errmg  ctime  etime
```

---

## セキュリティ構成

```
リクエスト
  └─ Supabase Auth (session cookie / JWT 検証)
       └─ withAudit() がトランザクションを開く
            ├─ SET LOCAL ROLE app_user|app_admin   ← RBAC
            ├─ set_config('app.current_user_id')   ← RLS に注入
            ├─ SQL 実行 (RLS が ownid で自動フィルタ)
            └─ TBL_AUDIT INSERT (同一 TX = 原子性保証)
```

---

## デプロイ手順

### Step 1: Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成 (リージョン: Tokyo)
2. **SQL Editor** で以下を順番に実行

| ファイル | 内容 |
|----------|------|
| `db/01_roles.sql` | app_user / app_admin ロール |
| `db/02_tables.sql` | コアテーブル |
| `db/03_rls.sql` | RLS ポリシー |
| `db/04_grants.sql` | 権限付与 |
| `db/05_assets.sql` | TBL_ASSET / TBL_BALAN |
| `db/06_accounts.sql` | TBL_ACCTS / TBL_SYNCL |

3. **Settings → Authentication → URL Configuration** で Site URL を設定

### Step 2: Vercel デプロイ

1. リポジトリをインポート
2. **Root Directory** → `frontend`
3. 環境変数を設定

| 変数名 | 値の取得元 |
|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `DATABASE_URL`                 | Supabase → Settings → Database → URI (port 6543) |

4. Deploy

### Step 3: Rust 同期サービス (任意)

```bash
cd backend
DATABASE_URL=... cargo run --bin server
```

Railway/Fly.io にデプロイすれば 30 分ごとに自動で残高を同期する。

---

## ローカル開発

```bash
cd frontend
cp .env.local.example .env.local
# .env.local を編集して Supabase の情報を記入
npm install
npm run dev
# → http://localhost:3000
```

---

## 口座自動連携の仕組み

```
1. ユーザが「口座を追加」→ TBL_ACCTS + TBL_ASSET を作成
2. 「同期」ボタンを押す  → TBL_ACCTS.state = 'sync' にセット
3. Rust ジョブが検知     → 30秒以内に処理開始
4. fetch_balance() 実行  → (現在: モック、本番: Open Banking API)
5. TBL_BALAN に残高記録  → グラフ・純資産に反映
6. TBL_SYNCL に実行ログ  → エラー追跡・監査

本番 API 連携への移行:
  backend/src/sync/fetcher.rs の fetch_balance() 内を
  実際の金融機関 API クライアントに置き換える。
```

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| **Supabase Auth** | メール/パスワード + OAuth ログイン |
| **純資産ダッシュボード** | 全口座の最新残高合計・先月比変化率 |
| **口座連携** | 銀行・証券・クレカを登録し自動同期 |
| **資産推移グラフ** | 積み上げエリアチャート (recharts) |
| **手動入力** | 自動連携できない口座の残高を直接記録 |
| **制限なし閲覧** | 過去データ無制限・カテゴリ分析無制限 |
| **監査ログ** | 全操作を TBL_AUDIT に原子的に記録 |
