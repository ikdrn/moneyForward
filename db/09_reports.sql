-- =============================================================
-- 09_reports.sql  ·  月次レポート / ポートフォリオ / 配当金
-- 規約: テーブル名9文字固定 / カラム名5文字固定
--
-- TBL_REPOT : 月次収支レポートキャッシュ  (Standard+)
-- TBL_PORTF : ポートフォリオ目標配分     (Advance+)
-- TBL_DIVID : 配当金・分配金履歴         (Advance+)
-- =============================================================

-- ── TBL_REPOT : 月次収支レポート ─────────────────────────────
-- TBL_TRANS を集計して毎月末バッチで生成・キャッシュ
-- API 呼び出し時にキャッシュがなければオンデマンド集計も可
CREATE TABLE IF NOT EXISTS TBL_REPOT (
  objid  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID          NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  ymont  CHAR(7)       NOT NULL,              -- 'YYYY-MM' 形式
  incms  NUMERIC(15,2) NOT NULL DEFAULT 0,    -- 収入合計
  expns  NUMERIC(15,2) NOT NULL DEFAULT 0,    -- 支出合計 (正の値で保存)
  savng  NUMERIC(15,2) GENERATED ALWAYS AS (incms - expns) STORED,  -- 貯蓄額
  ctime  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (ownid, ymont)
);

CREATE INDEX IF NOT EXISTS idx_repot_ownid ON TBL_REPOT(ownid);
CREATE INDEX IF NOT EXISTS idx_repot_ymont ON TBL_REPOT(ymont DESC);

COMMENT ON TABLE  TBL_REPOT       IS '月次収支レポートキャッシュ (Standard+)';
COMMENT ON COLUMN TBL_REPOT.objid IS 'レポートUUID (PK)';
COMMENT ON COLUMN TBL_REPOT.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_REPOT.ymont IS '対象年月 (YYYY-MM)';
COMMENT ON COLUMN TBL_REPOT.incms IS '収入合計 (円)';
COMMENT ON COLUMN TBL_REPOT.expns IS '支出合計 (円, 正値)';
COMMENT ON COLUMN TBL_REPOT.savng IS '貯蓄額 = 収入 - 支出 (自動計算)';

-- ── TBL_PORTF : ポートフォリオ目標配分 ───────────────────────
-- Advance プラン限定。資産種別ごとの目標比率を設定
-- 全 atype の trrat 合計が 100 になるよう UI 側で制御
CREATE TABLE IF NOT EXISTS TBL_PORTF (
  objid  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID          NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  atype  VARCHAR(10)   NOT NULL CHECK (atype IN ('bank', 'fund', 'card', 'pens', 'poin')),
  trrat  NUMERIC(5,2)  NOT NULL CHECK (trrat >= 0 AND trrat <= 100),  -- 目標比率 (%)
  ctime  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (ownid, atype)  -- 1ユーザ・1資産種別につき目標は1件
);

CREATE INDEX IF NOT EXISTS idx_portf_ownid ON TBL_PORTF(ownid);

COMMENT ON TABLE  TBL_PORTF       IS 'ポートフォリオ目標配分 (Advance+)';
COMMENT ON COLUMN TBL_PORTF.objid IS 'ポートフォリオUUID (PK)';
COMMENT ON COLUMN TBL_PORTF.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_PORTF.atype IS '資産種別';
COMMENT ON COLUMN TBL_PORTF.trrat IS '目標比率 (0.00 〜 100.00 %)';

-- ── TBL_DIVID : 配当金・分配金履歴 ───────────────────────────
-- 証券口座の配当金・投信の分配金を記録 (Advance+)
-- Rust 同期ジョブが自動挿入、または手動入力も可
CREATE TABLE IF NOT EXISTS TBL_DIVID (
  objid  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID          NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  astid  UUID          NOT NULL REFERENCES TBL_ASSET(objid) ON DELETE CASCADE,
  amnts  NUMERIC(12,2) NOT NULL CHECK (amnts > 0),  -- 配当金額 (税引後)
  dates  DATE          NOT NULL,                    -- 配当日
  notes  VARCHAR(200),                              -- 銘柄名・メモ
  ctime  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_divid_ownid ON TBL_DIVID(ownid);
CREATE INDEX IF NOT EXISTS idx_divid_astid ON TBL_DIVID(astid);
CREATE INDEX IF NOT EXISTS idx_divid_dates ON TBL_DIVID(dates DESC);

COMMENT ON TABLE  TBL_DIVID       IS '配当金・分配金履歴 (Advance+)';
COMMENT ON COLUMN TBL_DIVID.objid IS '配当UUID (PK)';
COMMENT ON COLUMN TBL_DIVID.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_DIVID.astid IS '資産UUID (FK → TBL_ASSET)';
COMMENT ON COLUMN TBL_DIVID.amnts IS '配当金額 (税引後, 円)';
COMMENT ON COLUMN TBL_DIVID.dates IS '配当支払日';
COMMENT ON COLUMN TBL_DIVID.notes IS '銘柄名・メモ';

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE TBL_REPOT ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_PORTF ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_DIVID ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_REPOT FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_PORTF FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_DIVID FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS repot_owner_all ON TBL_REPOT;
DROP POLICY IF EXISTS repot_admin_all ON TBL_REPOT;
DROP POLICY IF EXISTS portf_owner_all ON TBL_PORTF;
DROP POLICY IF EXISTS portf_admin_all ON TBL_PORTF;
DROP POLICY IF EXISTS divid_owner_all ON TBL_DIVID;
DROP POLICY IF EXISTS divid_admin_all ON TBL_DIVID;

CREATE POLICY repot_owner_all ON TBL_REPOT
  FOR ALL TO app_user
  USING  (ownid = current_user_id()) WITH CHECK (ownid = current_user_id());
CREATE POLICY repot_admin_all ON TBL_REPOT
  FOR ALL TO app_admin USING (true) WITH CHECK (true);

CREATE POLICY portf_owner_all ON TBL_PORTF
  FOR ALL TO app_user
  USING  (ownid = current_user_id()) WITH CHECK (ownid = current_user_id());
CREATE POLICY portf_admin_all ON TBL_PORTF
  FOR ALL TO app_admin USING (true) WITH CHECK (true);

CREATE POLICY divid_owner_all ON TBL_DIVID
  FOR ALL TO app_user
  USING  (ownid = current_user_id()) WITH CHECK (ownid = current_user_id());
CREATE POLICY divid_admin_all ON TBL_DIVID
  FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- ── GRANT ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_REPOT TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_PORTF TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_DIVID TO app_user;

GRANT ALL ON TBL_REPOT TO app_admin;
GRANT ALL ON TBL_PORTF TO app_admin;
GRANT ALL ON TBL_DIVID TO app_admin;
