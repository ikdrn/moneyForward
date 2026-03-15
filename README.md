# 家計簿アプリ

マルチテナント型家計簿。**Vercel + Supabase だけで完結**するシンプル構成。

```
ブラウザ
  └─ Next.js (Vercel)
       ├─ フロントエンド (App Router)
       └─ バックエンド   (API Routes /api/v1/...)
            └─ Supabase PostgreSQL
```

---

## デプロイ手順

### Step 1: Supabase セットアップ

#### 1-1. プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスしてログイン
2. **New project** をクリック
3. プロジェクト名・DB パスワード・リージョン (Northeast Asia - Tokyo) を入力して作成
4. プロジェクトが起動するまで 1〜2 分待つ

#### 1-2. SQL の実行

ダッシュボード左メニュー **SQL Editor** を開き、以下のファイルを**順番に**貼り付けて実行する。

| 順番 | ファイル | 内容 |
|------|----------|------|
| 1 | `db/01_roles.sql` | `app_user` / `app_admin` ロール作成 |
| 2 | `db/02_tables.sql` | 4テーブル作成 |
| 3 | `db/03_rls.sql` | 行レベルセキュリティ設定 |
| 4 | `db/04_grants.sql` | ロール別権限付与 |

> 各ファイルを開いて内容を全選択 → SQL Editor に貼り付け → **RUN** をクリック。

#### 1-3. 接続文字列を取得

左メニュー **Settings → Database** を開く。

**Connection string** セクションの **URI** タブを選択し、表示される文字列をコピーする。

```
# ポート 6543 (PgBouncer) の URI を使うこと
postgresql://postgres.<project-ref>:<your-password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

> ⚠️ ポートが **5432** のものではなく **6543** (Transaction mode) を選ぶと Vercel サーバーレスで安定する。

---

### Step 2: Vercel デプロイ

#### 2-1. プロジェクトをインポート

1. [vercel.com](https://vercel.com) にログイン
2. **Add New → Project** をクリック
3. このリポジトリを選択して **Import**

#### 2-2. Root Directory を設定 (重要)

**Configure Project** 画面の **Root Directory** 欄にある **Edit** をクリックし、`frontend` と入力する。

```
Root Directory: frontend    ← ここ
```

> これを設定しないと Vercel がリポジトリルートを Next.js プロジェクトとして認識できない。

#### 2-3. 環境変数を設定

同じ画面の **Environment Variables** に以下の 2 つを追加する。

| 変数名 | 値 |
|--------|----|
| `DATABASE_URL` | Step 1-3 でコピーした接続文字列 |
| `JWT_SECRET` | ランダムな文字列 (32 文字以上) |

> `JWT_SECRET` の生成例:
> ```bash
> openssl rand -base64 32
> ```

#### 2-4. デプロイ

**Deploy** ボタンをクリック。ビルドが完了すると URL が発行される。

```
https://<your-project>.vercel.app
```

以上でデプロイ完了。

---

## ローカル開発

```bash
# 1. 依存インストール
cd frontend
npm install

# 2. 環境変数を設定
cp .env.local.example .env.local
# → .env.local を開いて DATABASE_URL と JWT_SECRET を記入

# 3. 起動
npm run dev
# → http://localhost:3000
```

---

## プロジェクト構成

```
moneyForward/
├── db/                        Supabase で実行する SQL
│   ├── 01_roles.sql
│   ├── 02_tables.sql
│   ├── 03_rls.sql
│   └── 04_grants.sql
├── backend/                   Rust/Axum 実装 (参考・使用しない)
└── frontend/                  Next.js アプリ (Vercel にデプロイ)
    ├── src/
    │   ├── app/
    │   │   ├── api/v1/        API Routes (バックエンド)
    │   │   │   └── transactions/
    │   │   └── dashboard/     フロントエンド画面
    │   ├── lib/
    │   │   ├── db.ts          PostgreSQL 接続
    │   │   ├── auth.ts        JWT 検証
    │   │   ├── audit.ts       監査ログ (withAudit)
    │   │   └── errors.ts      エラーレスポンス
    │   └── types/
    │       └── bindings.ts    Rust から ts-rs で生成した型定義
    └── .env.local.example     環境変数テンプレート
```

---

## セキュリティ構成

```
リクエスト
  └─ JWT 検証 (src/lib/auth.ts)
       └─ withAudit() が PostgreSQL トランザクションを開く
            ├─ SET LOCAL ROLE app_user|app_admin   ← RBAC
            ├─ set_config('app.current_user_id')   ← RLS へ注入
            ├─ SQL 実行 (RLS が ownid で自動フィルタ)
            └─ TBL_AUDIT INSERT (同一トランザクション = 原子性)
```

---

## DB カラム規約

| 規約 | 詳細 |
|------|------|
| テーブル名 | `TBL_` で始まる 9 文字固定 |
| カラム名 | 小文字 5 文字固定・アンダースコア不使用 |
| PK | `objid` (UUID) |

```
TBL_USERS : objid  email  roles  ctime
TBL_CATEG : objid  ownid  cname  ctype  ctime
TBL_TRANS : objid  ownid  catid  amnts  dates  ctime
TBL_AUDIT : objid  ownid  actio  ctime
```
