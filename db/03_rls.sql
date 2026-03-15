-- =============================================================
-- 03_rls.sql  ·  Row Level Security Policies
-- 方針: RLS + RBAC の二重防御
--   - current_setting('app.current_user_id') を JWT から Rust が SET LOCAL で注入
--   - current_setting('app.current_role')    を JWT claim から注入
-- =============================================================

-- ── RLS 有効化 ───────────────────────────────────────────────
ALTER TABLE TBL_USERS  ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_CATEG  ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_TRANS  ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_AUDIT  ENABLE ROW LEVEL SECURITY;

-- テーブルオーナー(postgres)はバイパス
ALTER TABLE TBL_USERS  FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_CATEG  FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_TRANS  FORCE ROW LEVEL SECURITY;
ALTER TABLE TBL_AUDIT  FORCE ROW LEVEL SECURITY;

-- ── ヘルパー関数 ─────────────────────────────────────────────
-- Rust が SET LOCAL app.current_user_id = '<uuid>' を実行後に呼ぶ
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID
  LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_user_id', true)::UUID;
$$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
  LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_role', true) = 'app_admin';
$$;

-- ── TBL_USERS ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS users_self_select  ON TBL_USERS;
DROP POLICY IF EXISTS users_self_update  ON TBL_USERS;
DROP POLICY IF EXISTS users_admin_all    ON TBL_USERS;

-- 自分のレコードのみ参照可
CREATE POLICY users_self_select ON TBL_USERS
  FOR SELECT TO app_user
  USING (id___ = current_user_id());

-- 管理者は全レコード参照可
CREATE POLICY users_admin_all ON TBL_USERS
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── TBL_CATEG ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS categ_owner_all    ON TBL_CATEG;
DROP POLICY IF EXISTS categ_admin_all    ON TBL_CATEG;

-- 自テナントのみ操作可
CREATE POLICY categ_owner_all ON TBL_CATEG
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY categ_admin_all ON TBL_CATEG
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── TBL_TRANS ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS trans_owner_all    ON TBL_TRANS;
DROP POLICY IF EXISTS trans_admin_all    ON TBL_TRANS;

CREATE POLICY trans_owner_all ON TBL_TRANS
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY trans_admin_all ON TBL_TRANS
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── TBL_AUDIT ポリシー ───────────────────────────────────────
DROP POLICY IF EXISTS audit_owner_select ON TBL_AUDIT;
DROP POLICY IF EXISTS audit_owner_insert ON TBL_AUDIT;
DROP POLICY IF EXISTS audit_admin_all    ON TBL_AUDIT;

-- 自分のログのみ参照可 (書き込みは内部処理のみ)
CREATE POLICY audit_owner_select ON TBL_AUDIT
  FOR SELECT TO app_user
  USING (ownid = current_user_id());

CREATE POLICY audit_owner_insert ON TBL_AUDIT
  FOR INSERT TO app_user
  WITH CHECK (ownid = current_user_id());

CREATE POLICY audit_admin_all ON TBL_AUDIT
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);
