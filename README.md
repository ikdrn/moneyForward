# 家計簿アプリ

マルチテナント型家計簿アプリ。Next.js (Vercel) + Rust/Axum (Railway) + Supabase (PostgreSQL) 構成。

---

## 全体構成

```
moneyForward/
├── db/          SQL スキーマ (Supabase で実行)
├── backend/     Rust/Axum API サーバ (Railway にデプロイ)
└── frontend/    Next.js フロントエンド (Vercel にデプロイ)
```

デプロイの順番は **Supabase → Railway → Vercel** の順に行う。

---

## Step 1: Supabase セットアップ

### 1-1. プロジェクト作成

1. [supabase.com](https://supabase.com) にログイン
2. **New project** をクリック
3. プロジェクト名・パスワード・リージョン (Tokyo 推奨) を入力して作成

### 1-2. SQL の実行

Supabase ダッシュボード左メニューの **SQL Editor** を開き、以下の順番でファイルの内容を貼り付けて実行する。

| 順番 | ファイル | 内容 |
|------|----------|------|
| 1 | `db/01_roles.sql` | ロール作成 |
| 2 | `db/02_tables.sql` | テーブル作成 |
| 3 | `db/03_rls.sql` | RLS ポリシー |
| 4 | `db/04_grants.sql` | 権限付与 |

### 1-3. 接続文字列の取得

**Settings → Database → Connection string → URI** をコピーする。

```
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

> パスワードはプロジェクト作成時に設定したもの。

---

## Step 2: Railway (Rust バックエンド) デプロイ

### 2-1. Railway プロジェクト作成

1. [railway.app](https://railway.app) にログインし **New Project** をクリック
2. **Deploy from GitHub repo** を選択してこのリポジトリを接続

### 2-2. Root Directory の設定

Railway ダッシュボードでサービスを選択し、**Settings → Source → Root Directory** に `backend` を入力する。

### 2-3. 環境変数の設定

Railway ダッシュボードの **Variables** に以下を追加する。

| 変数名 | 値 |
|--------|----|
| `DATABASE_URL` | Step 1-3 でコピーした接続文字列 |
| `JWT_SECRET` | ランダムな長い文字列 (32文字以上推奨) |
| `PORT` | `8080` |
| `RUST_LOG` | `info` |

### 2-4. デプロイ確認

Railway がビルドを開始する。ログに `listening on 0.0.0.0:8080` が表示されれば成功。

**Settings → Networking → Public Networking** でドメインを発行し、URL をメモしておく。

```
例: https://money-forward-api-production.up.railway.app
```

---

## Step 3: Vercel (Next.js フロントエンド) デプロイ

### 3-1. Vercel プロジェクト作成

1. [vercel.com](https://vercel.com) にログインし **Add New → Project** をクリック
2. このリポジトリをインポート

### 3-2. Root Directory の設定 (重要)

**Configure Project** 画面で **Root Directory** の **Edit** をクリックし、`frontend` を入力する。

> `vercel.json` はリポジトリルートに置いてあるが、`rootDirectory` はダッシュボードで設定する必要がある。

### 3-3. 環境変数の設定

同画面の **Environment Variables** に以下を追加する。

| 変数名 | 値 |
|--------|----|
| `NEXT_PUBLIC_API_URL` | Step 2-4 でメモした Railway の URL |

### 3-4. デプロイ

**Deploy** ボタンをクリック。ビルドが完了すると `https://<your-project>.vercel.app` が発行される。

---

## ローカル開発

### 前提

- Rust (1.79 以上)
- Node.js (20 以上)
- Docker (任意・ローカル DB 用)

### バックエンド起動

```bash
cd backend
cp .env.example .env
# .env の DATABASE_URL と JWT_SECRET を編集する

cargo run --bin server
# → http://localhost:8080
```

### フロントエンド起動

```bash
cd frontend
cp .env.local.example .env.local
# .env.local の NEXT_PUBLIC_API_URL を確認 (デフォルト: http://localhost:8080)

npm install
npm run dev
# → http://localhost:3000
```

---

## DB カラム規約

| 規約 | 内容 |
|------|------|
| テーブル名 | `TBL_` で始まる 9 文字固定 |
| カラム名 | 小文字 5 文字固定、アンダースコア不使用 |
| PK | `objid` (UUID) |

```
TBL_USERS : objid, email, roles, ctime
TBL_CATEG : objid, ownid, cname, ctype, ctime
TBL_TRANS : objid, ownid, catid, amnts, dates, ctime
TBL_AUDIT : objid, ownid, actio, ctime
```

---

## セキュリティ構成

```
リクエスト
  └─ JWT 検証 (Axum middleware)
       └─ SET LOCAL ROLE app_user|app_admin     ← RBAC
            └─ SET LOCAL app.current_user_id    ← RLS へ注入
                 └─ SQL 実行 (RLS が自動フィルタ) ← 行レベル隔離
                      └─ TBL_AUDIT INSERT       ← 監査ログ (同一トランザクション)
```
