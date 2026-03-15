-- =============================================================
-- 05_assets.sql  ·  資産マスタ + 残高履歴 + RLS + GRANT
-- 規約:
--   テーブル名 … TBL_ で開始、9文字固定
--   カラム名   … 小文字5文字固定、アンダースコア不使用
-- =============================================================

-- ── TBL_ASSET : 資産マスタ ────────────────────────────────────
-- 銀行口座 (bank) または投資信託 (fund) を登録するマスタテーブル
CREATE TABLE IF NOT EXISTS TBL_ASSET (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  aname  VARCHAR(100) NOT NULL CHECK (char_length(aname) >= 1),
  atype  VARCHAR(10)  NOT NULL CHECK (atype IN ('bank', 'fund')),
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_ownid ON TBL_ASSET(ownid);

COMMENT ON TABLE  TBL_ASSET       IS '資産マスタ (銀行口座・投資信託)';
COMMENT ON COLUMN TBL_ASSET.objid IS '資産UUID (PK)';
COMMENT ON COLUMN TBL_ASSET.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_ASSET.aname IS '資産名称 (口座名・ファンド名)';
COMMENT ON COLUMN TBL_ASSET.atype IS '資産種別: bank=銀行口座 | fund=投資信託';
COMMENT ON COLUMN TBL_ASSET.ctime IS '作成日時';

-- ── TBL_BALAN : 残高履歴スナップショット ──────────────────────
-- 各資産の特定日時点の残高を記録する時系列テーブル
-- 同一資産・同一日の重複登録を UNIQUE 制約で防止
CREATE TABLE IF NOT EXISTS TBL_BALAN (
  objid  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID          NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  astid  UUID          NOT NULL REFERENCES TBL_ASSET(objid) ON DELETE CASCADE,
  amnts  NUMERIC(15,2) NOT NULL CHECK (amnts >= 0),
  dates  DATE          NOT NULL,
  ctime  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (astid, dates)  -- 同一資産・同一日は 1 レコードのみ
);

CREATE INDEX IF NOT EXISTS idx_balan_ownid ON TBL_BALAN(ownid);
CREATE INDEX IF NOT EXISTS idx_balan_astid ON TBL_BALAN(astid);
CREATE INDEX IF NOT EXISTS idx_balan_dates ON TBL_BALAN(dates DESC);

COMMENT ON TABLE  TBL_BALAN       IS '残高履歴スナップショット';
COMMENT ON COLUMN TBL_BALAN.objid IS '残高履歴UUID (PK)';
COMMENT ON COLUMN TBL_BALAN.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_BALAN.astid IS '資産UUID (FK → TBL_ASSET)';
COMMENT ON COLUMN TBL_BALAN.amnts IS '残高 (0以上)';
COMMENT ON COLUMN TBL_BALAN.dates IS '記録日 (YYYY-MM-DD)';
COMMENT ON COLUMN TBL_BALAN.ctime IS '作成日時';

-- ── RLS 有効化 ───────────────────────────────────────────────
ALTER TABLE TBL_ASSET ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_BALAN ENABLE ROW LEVEL SECURITY;

ALTER TABLE TBL_ASSET FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_BALAN FORCE ROW LEVEL SECURITY;

-- ── TBL_ASSET ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS asset_owner_all ON TBL_ASSET;
DROP POLICY IF EXISTS asset_admin_all ON TBL_ASSET;

-- 自テナントのみ操作可
CREATE POLICY asset_owner_all ON TBL_ASSET
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY asset_admin_all ON TBL_ASSET
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── TBL_BALAN ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS balan_owner_all ON TBL_BALAN;
DROP POLICY IF EXISTS balan_admin_all ON TBL_BALAN;

-- 自テナントのみ操作可
CREATE POLICY balan_owner_all ON TBL_BALAN
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY balan_admin_all ON TBL_BALAN
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── GRANT ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_ASSET TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_BALAN TO app_user;

GRANT ALL ON TBL_ASSET TO app_admin;
GRANT ALL ON TBL_BALAN TO app_admin;
