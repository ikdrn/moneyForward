-- =============================================================
-- 07_premium.sql  ·  プランマスタ + ユーザサブスクリプション
-- 規約: テーブル名9文字固定 / カラム名5文字固定
--
-- TBL_PLANS : プランマスタ (free / standard / advance)
-- TBL_SUBSC : ユーザのサブスクリプション状態
-- =============================================================

-- ── TBL_PLANS : プランマスタ ──────────────────────────────────
-- マネフォME 相当のプラン体系
--   free     : 無料  ・口座4件・データ12ヶ月
--   standard : ¥540  ・口座無制限・データ無制限・マンスリーレポート
--   advance  : ¥980  ・standard + ポートフォリオ・配当金追跡
CREATE TABLE IF NOT EXISTS TBL_PLANS (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  pname  VARCHAR(20)  NOT NULL UNIQUE
                      CHECK (pname IN ('free', 'standard', 'advance')),
  price  INTEGER      NOT NULL DEFAULT 0 CHECK (price >= 0),  -- 月額(円)
  acclm  INTEGER      NOT NULL DEFAULT 4 CHECK (acclm >= -1), -- 口座上限 (-1=無制限)
  hislm  INTEGER      NOT NULL DEFAULT 12 CHECK (hislm >= -1),-- 履歴上限月 (-1=無制限)
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  TBL_PLANS       IS 'プランマスタ';
COMMENT ON COLUMN TBL_PLANS.objid IS 'プランUUID (PK)';
COMMENT ON COLUMN TBL_PLANS.pname IS 'プラン名: free | standard | advance';
COMMENT ON COLUMN TBL_PLANS.price IS '月額料金 (円)';
COMMENT ON COLUMN TBL_PLANS.acclm IS '口座連携上限数 (-1=無制限)';
COMMENT ON COLUMN TBL_PLANS.hislm IS '残高履歴保存上限月数 (-1=無制限)';

-- プラン定義を初期挿入
INSERT INTO TBL_PLANS (pname, price, acclm, hislm) VALUES
  ('free',     0,   -1, -1),  -- セルフホスト: 全機能無制限
  ('standard', 540, -1, -1),
  ('advance',  980, -1, -1)
ON CONFLICT (pname) DO UPDATE SET
  price = EXCLUDED.price,
  acclm = EXCLUDED.acclm,
  hislm = EXCLUDED.hislm;

-- ── TBL_SUBSC : ユーザサブスクリプション ─────────────────────
CREATE TABLE IF NOT EXISTS TBL_SUBSC (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  plnid  UUID         NOT NULL REFERENCES TBL_PLANS(objid),
  stime  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- 開始日時
  etime  TIMESTAMPTZ,                           -- 終了日時 (null=継続中)
  state  VARCHAR(10)  NOT NULL DEFAULT 'activ'
                      CHECK (state IN ('activ', 'cancl', 'exprd')),
  ctime  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ownid)  -- 1ユーザにつきアクティブな契約は1件
);

CREATE INDEX IF NOT EXISTS idx_subsc_ownid ON TBL_SUBSC(ownid);

COMMENT ON TABLE  TBL_SUBSC       IS 'ユーザサブスクリプション';
COMMENT ON COLUMN TBL_SUBSC.objid IS 'サブスクUUID (PK)';
COMMENT ON COLUMN TBL_SUBSC.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_SUBSC.plnid IS 'プランUUID (FK → TBL_PLANS)';
COMMENT ON COLUMN TBL_SUBSC.stime IS 'サブスク開始日時';
COMMENT ON COLUMN TBL_SUBSC.etime IS 'サブスク終了日時 (null=継続中)';
COMMENT ON COLUMN TBL_SUBSC.state IS '状態: activ=有効 | cancl=解約済 | exprd=期限切れ';

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE TBL_PLANS ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_SUBSC ENABLE ROW LEVEL SECURITY;

-- プランマスタは全員参照可
DROP POLICY IF EXISTS plans_read_all ON TBL_PLANS;
CREATE POLICY plans_read_all ON TBL_PLANS
  FOR SELECT TO app_user, app_admin USING (true);

-- サブスクは自分のものだけ
DROP POLICY IF EXISTS subsc_owner_all ON TBL_SUBSC;
DROP POLICY IF EXISTS subsc_admin_all ON TBL_SUBSC;

CREATE POLICY subsc_owner_all ON TBL_SUBSC
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY subsc_admin_all ON TBL_SUBSC
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── GRANT ────────────────────────────────────────────────────
GRANT SELECT ON TBL_PLANS TO app_user;
GRANT SELECT, INSERT, UPDATE ON TBL_SUBSC TO app_user;

GRANT ALL ON TBL_PLANS TO app_admin;
GRANT ALL ON TBL_SUBSC TO app_admin;
