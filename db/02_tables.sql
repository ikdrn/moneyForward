-- =============================================================
-- 02_tables.sql  ·  Table Definitions
-- 規約:
--   テーブル名 … TBL_ で開始、9文字固定
--   カラム名   … 小文字5文字固定、アンダースコア不使用
-- =============================================================

-- pgcrypto / uuid 拡張 (Supabase はデフォルト有効)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TBL_USERS ────────────────────────────────────────────────
-- ユーザ管理テーブル (Supabase auth.users と 1:1 対応)
CREATE TABLE IF NOT EXISTS TBL_USERS (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email  VARCHAR(255) NOT NULL UNIQUE,
  roles  VARCHAR(20)  NOT NULL DEFAULT 'app_user'
                      CHECK (roles IN ('app_user', 'app_admin')),
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  TBL_USERS       IS 'ユーザマスタ';
COMMENT ON COLUMN TBL_USERS.objid IS 'ユーザUUID (PK)';
COMMENT ON COLUMN TBL_USERS.email IS 'メールアドレス';
COMMENT ON COLUMN TBL_USERS.roles IS 'アプリケーションロール';
COMMENT ON COLUMN TBL_USERS.ctime IS '作成日時';

-- ── TBL_CATEG ────────────────────────────────────────────────
-- 科目マスタ (テナント = ownid ユーザ個人)
CREATE TABLE IF NOT EXISTS TBL_CATEG (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  cname  VARCHAR(100) NOT NULL,
  ctype  VARCHAR(10)  NOT NULL CHECK (ctype IN ('income', 'expense')),
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categ_ownid ON TBL_CATEG(ownid);

COMMENT ON TABLE  TBL_CATEG       IS '科目マスタ';
COMMENT ON COLUMN TBL_CATEG.objid IS '科目UUID (PK)';
COMMENT ON COLUMN TBL_CATEG.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_CATEG.cname IS '科目名';
COMMENT ON COLUMN TBL_CATEG.ctype IS '種別: income | expense';
COMMENT ON COLUMN TBL_CATEG.ctime IS '作成日時';

-- ── TBL_TRANS ────────────────────────────────────────────────
-- 明細 (収支トランザクション)
CREATE TABLE IF NOT EXISTS TBL_TRANS (
  objid  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID          NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  catid  UUID          NOT NULL REFERENCES TBL_CATEG(objid) ON DELETE RESTRICT,
  amnts  NUMERIC(12,2) NOT NULL CHECK (amnts <> 0),
  dates  DATE          NOT NULL,
  ctime  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trans_ownid ON TBL_TRANS(ownid);
CREATE INDEX IF NOT EXISTS idx_trans_dates ON TBL_TRANS(dates DESC);
CREATE INDEX IF NOT EXISTS idx_trans_catid ON TBL_TRANS(catid);

COMMENT ON TABLE  TBL_TRANS       IS '収支明細';
COMMENT ON COLUMN TBL_TRANS.objid IS '明細UUID (PK)';
COMMENT ON COLUMN TBL_TRANS.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_TRANS.catid IS '科目UUID (FK → TBL_CATEG)';
COMMENT ON COLUMN TBL_TRANS.amnts IS '金額 (正=収入, 負=支出)';
COMMENT ON COLUMN TBL_TRANS.dates IS '取引日';
COMMENT ON COLUMN TBL_TRANS.ctime IS '作成日時';

-- ── TBL_AUDIT ────────────────────────────────────────────────
-- 監査ログ (全 DB 操作を自動記録)
CREATE TABLE IF NOT EXISTS TBL_AUDIT (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         REFERENCES TBL_USERS(objid) ON DELETE SET NULL,
  actio  VARCHAR(200) NOT NULL,
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_ownid ON TBL_AUDIT(ownid);
CREATE INDEX IF NOT EXISTS idx_audit_ctime ON TBL_AUDIT(ctime DESC);

COMMENT ON TABLE  TBL_AUDIT       IS '操作監査ログ';
COMMENT ON COLUMN TBL_AUDIT.objid IS '監査ログUUID (PK)';
COMMENT ON COLUMN TBL_AUDIT.ownid IS '操作ユーザUUID';
COMMENT ON COLUMN TBL_AUDIT.actio IS '操作内容 (ACTION:target_id)';
COMMENT ON COLUMN TBL_AUDIT.ctime IS '操作日時';
