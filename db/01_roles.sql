-- =============================================================
-- 01_roles.sql  ·  Database Role Definitions
-- Convention: all role names are prefixed with app_
-- =============================================================

-- ── ロール作成 ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin NOLOGIN;
  END IF;
END
$$;

-- app_admin は app_user のすべての権限を継承する
GRANT app_user TO app_admin;

-- Supabase authenticator に両ロールを付与
-- (authenticator は実行時に SET ROLE で切り替える)
GRANT app_user  TO authenticator;
GRANT app_admin TO authenticator;

COMMENT ON ROLE app_user  IS '一般ユーザ向け基本操作ロール';
COMMENT ON ROLE app_admin IS 'システム管理者向けロール (app_user を継承)';
