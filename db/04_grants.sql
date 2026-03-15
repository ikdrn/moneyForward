-- =============================================================
-- 04_grants.sql  ·  Privilege Grants
-- =============================================================

-- ── スキーマ参照権 ──────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA public TO app_admin;

-- ── TBL_USERS ────────────────────────────────────────────────
GRANT SELECT, UPDATE            ON TBL_USERS TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_USERS TO app_admin;

-- ── TBL_CATEG ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_CATEG TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_CATEG TO app_admin;

-- ── TBL_TRANS ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_TRANS TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_TRANS TO app_admin;

-- ── TBL_AUDIT ────────────────────────────────────────────────
-- app_user は SELECT と INSERT のみ (改ざん防止)
GRANT SELECT, INSERT               ON TBL_AUDIT TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_AUDIT TO app_admin;

-- ── シーケンス ───────────────────────────────────────────────
-- UUID 型のため SEQUENCE 不要 (gen_random_uuid() を使用)

-- ── ヘルパー関数 ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION current_user_id() TO app_user, app_admin;
GRANT EXECUTE ON FUNCTION is_admin()        TO app_user, app_admin;
