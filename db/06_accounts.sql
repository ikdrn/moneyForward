-- =============================================================
-- 06_accounts.sql  ·  口座連携マスタ + 同期ログ
-- 規約: テーブル名9文字固定 / カラム名5文字固定
--
-- TBL_ACCTS : 連携口座マスタ (銀行・証券・クレカ)
-- TBL_SYNCL : 同期実行ログ
-- =============================================================

-- ── TBL_ACCTS : 連携口座 ─────────────────────────────────────
-- 金融機関口座を資産 (TBL_ASSET.astid) と紐付けて管理する
-- Rust バックグラウンドジョブが state を見て自動同期を判断する
CREATE TABLE IF NOT EXISTS TBL_ACCTS (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  astid  UUID         NOT NULL REFERENCES TBL_ASSET(objid) ON DELETE CASCADE,
  iname  VARCHAR(100) NOT NULL CHECK (char_length(iname) >= 1),
  itype  VARCHAR(10)  NOT NULL CHECK (itype IN ('bank', 'brok', 'card')),
  state  VARCHAR(10)  NOT NULL DEFAULT 'idle'
         CHECK (state IN ('idle', 'sync', 'done', 'erro')),
  lsync  TIMESTAMPTZ,          -- 最終同期日時 (null = 未同期)
  ctime  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accts_ownid ON TBL_ACCTS(ownid);
CREATE INDEX IF NOT EXISTS idx_accts_state ON TBL_ACCTS(state) WHERE state IN ('idle', 'sync');
CREATE INDEX IF NOT EXISTS idx_accts_astid ON TBL_ACCTS(astid);

COMMENT ON TABLE  TBL_ACCTS       IS '連携口座マスタ (銀行・証券・クレカ)';
COMMENT ON COLUMN TBL_ACCTS.objid IS '連携口座UUID (PK)';
COMMENT ON COLUMN TBL_ACCTS.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_ACCTS.astid IS '対応資産UUID (FK → TBL_ASSET)';
COMMENT ON COLUMN TBL_ACCTS.iname IS '金融機関名称';
COMMENT ON COLUMN TBL_ACCTS.itype IS '口座種別: bank=銀行 | brok=証券 | card=クレカ';
COMMENT ON COLUMN TBL_ACCTS.state IS '同期状態: idle=待機 | sync=実行中 | done=完了 | erro=エラー';
COMMENT ON COLUMN TBL_ACCTS.lsync IS '最終同期完了日時';
COMMENT ON COLUMN TBL_ACCTS.ctime IS '作成日時';

-- ── TBL_SYNCL : 同期実行ログ ──────────────────────────────────
-- 各同期ジョブの実行記録。エラー調査・監査に使用する
CREATE TABLE IF NOT EXISTS TBL_SYNCL (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL,
  accid  UUID         NOT NULL REFERENCES TBL_ACCTS(objid) ON DELETE CASCADE,
  state  VARCHAR(10)  NOT NULL DEFAULT 'runn'
         CHECK (state IN ('runn', 'done', 'erro')),
  errmg  TEXT,                  -- エラーメッセージ (state=erro 時のみ)
  ctime  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  etime  TIMESTAMPTZ            -- 完了日時 (runn 中は null)
);

CREATE INDEX IF NOT EXISTS idx_syncl_accid ON TBL_SYNCL(accid);
CREATE INDEX IF NOT EXISTS idx_syncl_ownid ON TBL_SYNCL(ownid);

COMMENT ON TABLE  TBL_SYNCL       IS '同期実行ログ';
COMMENT ON COLUMN TBL_SYNCL.objid IS '同期ログUUID (PK)';
COMMENT ON COLUMN TBL_SYNCL.ownid IS '所有ユーザUUID';
COMMENT ON COLUMN TBL_SYNCL.accid IS '連携口座UUID (FK → TBL_ACCTS)';
COMMENT ON COLUMN TBL_SYNCL.state IS '実行状態: runn=実行中 | done=完了 | erro=エラー';
COMMENT ON COLUMN TBL_SYNCL.errmg IS 'エラーメッセージ';
COMMENT ON COLUMN TBL_SYNCL.ctime IS '同期開始日時';
COMMENT ON COLUMN TBL_SYNCL.etime IS '同期完了日時';

-- ── RLS 有効化 ───────────────────────────────────────────────
ALTER TABLE TBL_ACCTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_SYNCL ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_ACCTS FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_SYNCL FORCE ROW LEVEL SECURITY;

-- ── TBL_ACCTS ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS accts_owner_all ON TBL_ACCTS;
DROP POLICY IF EXISTS accts_admin_all ON TBL_ACCTS;

CREATE POLICY accts_owner_all ON TBL_ACCTS
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY accts_admin_all ON TBL_ACCTS
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── TBL_SYNCL ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS syncl_owner_select ON TBL_SYNCL;
DROP POLICY IF EXISTS syncl_owner_insert ON TBL_SYNCL;
DROP POLICY IF EXISTS syncl_admin_all    ON TBL_SYNCL;

-- ユーザは自分の同期ログのみ参照可 (書き込みはシステム側)
CREATE POLICY syncl_owner_select ON TBL_SYNCL
  FOR SELECT TO app_user
  USING (ownid = current_user_id());

CREATE POLICY syncl_owner_insert ON TBL_SYNCL
  FOR INSERT TO app_user
  WITH CHECK (ownid = current_user_id());

CREATE POLICY syncl_admin_all ON TBL_SYNCL
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── GRANT ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_ACCTS TO app_user;
GRANT SELECT, INSERT               ON TBL_SYNCL TO app_user;  -- 改ざん防止: SELECT+INSERT のみ

GRANT ALL ON TBL_ACCTS TO app_admin;
GRANT ALL ON TBL_SYNCL TO app_admin;
