-- =============================================================
-- 08_connect.sql  ·  金融機関API連携テーブル + TBL_ACCTS拡張
-- 規約: テーブル名9文字固定 / カラム名5文字固定
--
-- TBL_CREDS : OAuth / スクレイピング認証情報 (暗号化保存)
-- TBL_ACCTS : ifcod (金融機関コード) / scnum (口座番号末尾4桁) 追加
-- TBL_ASSET : atype に 'card' / 'pens' / 'poin' を追加
-- =============================================================

-- pgcrypto が有効であることを確認
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TBL_ASSET.atype 拡張 ─────────────────────────────────────
-- bank=銀行 / fund=投資信託 / card=クレジットカード / pens=年金 / poin=ポイント
ALTER TABLE TBL_ASSET DROP CONSTRAINT IF EXISTS tbl_asset_atype_check;
ALTER TABLE TBL_ASSET ADD CONSTRAINT tbl_asset_atype_check
  CHECK (atype IN ('bank', 'fund', 'card', 'pens', 'poin'));

-- ── TBL_ACCTS 拡張 ────────────────────────────────────────────
-- 金融機関コード (全銀協 4桁) と口座番号下4桁を追加
ALTER TABLE TBL_ACCTS ADD COLUMN IF NOT EXISTS
  ifcod  CHAR(4);          -- 金融機関コード (例: 0005=三菱UFJ)
ALTER TABLE TBL_ACCTS ADD COLUMN IF NOT EXISTS
  scnum  VARCHAR(4);       -- 口座番号末尾4桁 (マスク表示用)

COMMENT ON COLUMN TBL_ACCTS.ifcod IS '全銀協 金融機関コード (4桁)';
COMMENT ON COLUMN TBL_ACCTS.scnum IS '口座番号末尾4桁 (表示用マスク)';

-- ── TBL_CREDS : OAuth / 認証情報 ─────────────────────────────
-- Open Banking OAuth2 または スクレイピング用ID/PWを暗号化保存
-- 暗号化: pgcrypto の pgp_sym_encrypt を使用
--   INSERT時: pgp_sym_encrypt(plaintext, current_setting('app.secret_key'))
--   SELECT時: pgp_sym_decrypt(atokn::bytea, current_setting('app.secret_key'))
CREATE TABLE IF NOT EXISTS TBL_CREDS (
  objid  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ownid  UUID         NOT NULL REFERENCES TBL_USERS(objid) ON DELETE CASCADE,
  accid  UUID         NOT NULL REFERENCES TBL_ACCTS(objid) ON DELETE CASCADE,
  toknt  VARCHAR(10)  NOT NULL CHECK (toknt IN ('oauth', 'scrap')),
  -- oauth  : Open Banking API (access_token / refresh_token)
  -- scrap  : スクレイピング用ログイン情報 (ID / password)
  atokn  TEXT,              -- アクセストークン or ログインID (暗号化)
  rtokn  TEXT,              -- リフレッシュトークン or パスワード (暗号化)
  texpt  TIMESTAMPTZ,       -- トークン有効期限 (oauth のみ)
  ctime  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (accid)            -- 1口座につき認証情報は1件
);

CREATE INDEX IF NOT EXISTS idx_creds_ownid ON TBL_CREDS(ownid);
CREATE INDEX IF NOT EXISTS idx_creds_accid ON TBL_CREDS(accid);

COMMENT ON TABLE  TBL_CREDS       IS '金融機関API認証情報 (暗号化)';
COMMENT ON COLUMN TBL_CREDS.objid IS '認証情報UUID (PK)';
COMMENT ON COLUMN TBL_CREDS.ownid IS '所有ユーザUUID (FK → TBL_USERS)';
COMMENT ON COLUMN TBL_CREDS.accid IS '連携口座UUID (FK → TBL_ACCTS)';
COMMENT ON COLUMN TBL_CREDS.toknt IS '認証方式: oauth=OAuth2 | scrap=スクレイピング';
COMMENT ON COLUMN TBL_CREDS.atokn IS 'アクセストークン / ログインID (pgp_sym_encrypt)';
COMMENT ON COLUMN TBL_CREDS.rtokn IS 'リフレッシュトークン / パスワード (pgp_sym_encrypt)';
COMMENT ON COLUMN TBL_CREDS.texpt IS 'トークン有効期限';

-- ── 主要金融機関コード参考テーブル ───────────────────────────
-- 全銀協コード (https://www.zengin-net.or.jp)
-- アプリ内での機関コード → 名称解決に使用
CREATE TABLE IF NOT EXISTS TBL_IFMAS (
  ifcod  CHAR(4)      PRIMARY KEY,      -- 金融機関コード
  iname  VARCHAR(100) NOT NULL,         -- 金融機関名
  itype  VARCHAR(10)  NOT NULL CHECK (itype IN ('bank', 'card', 'secu', 'pens', 'poin'))
);

COMMENT ON TABLE  TBL_IFMAS       IS '金融機関マスタ (全銀協コード)';
COMMENT ON COLUMN TBL_IFMAS.ifcod IS '全銀協 金融機関コード';
COMMENT ON COLUMN TBL_IFMAS.iname IS '金融機関名称';
COMMENT ON COLUMN TBL_IFMAS.itype IS '種別: bank=銀行 | card=カード | secu=証券 | pens=年金 | poin=ポイント';

-- 主要機関の初期データ
INSERT INTO TBL_IFMAS (ifcod, iname, itype) VALUES
  ('0001', '日本銀行',                 'bank'),
  ('0005', '三菱UFJ銀行',             'bank'),
  ('0009', '三井住友銀行',             'bank'),
  ('0010', 'りそな銀行',               'bank'),
  ('0033', 'ジャパンネット銀行(PayPay銀行)', 'bank'),
  ('0036', '楽天銀行',                 'bank'),
  ('0038', 'セブン銀行',               'bank'),
  ('0039', 'ソニー銀行',               'bank'),
  ('0040', '住信SBIネット銀行',        'bank'),
  ('0116', '北海道銀行',               'bank'),
  ('0117', '青森銀行',                 'bank'),
  ('0130', '東北銀行',                 'bank'),
  ('0310', 'みずほ銀行',               'bank'),
  ('0311', '中央三井信託銀行',          'bank'),
  ('1000', 'ゆうちょ銀行',             'bank'),
  ('9S01', 'SBI証券',                  'secu'),
  ('9S02', '楽天証券',                 'secu'),
  ('9S03', 'マネックス証券',            'secu'),
  ('9S04', '野村證券',                 'secu'),
  ('9S05', '大和証券',                 'secu'),
  ('9C01', '三井住友カード',            'card'),
  ('9C02', '楽天カード',               'card'),
  ('9C03', 'JCBカード',               'card'),
  ('9P01', '楽天ポイント',             'poin'),
  ('9P02', 'Tポイント',               'poin'),
  ('9P03', 'dポイント',               'poin')
ON CONFLICT (ifcod) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE TBL_CREDS ENABLE ROW LEVEL SECURITY;
ALTER TABLE TBL_CREDS FORCE ROW LEVEL SECURITY;

-- 金融機関マスタは全員参照可 (RLS不要 → GRANT SELECTのみ)
ALTER TABLE TBL_IFMAS ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ifmas_read_all ON TBL_IFMAS;
CREATE POLICY ifmas_read_all ON TBL_IFMAS
  FOR SELECT TO app_user, app_admin USING (true);

-- 認証情報は自分のものだけ操作可
DROP POLICY IF EXISTS creds_owner_all ON TBL_CREDS;
DROP POLICY IF EXISTS creds_admin_all ON TBL_CREDS;

CREATE POLICY creds_owner_all ON TBL_CREDS
  FOR ALL TO app_user
  USING  (ownid = current_user_id())
  WITH CHECK (ownid = current_user_id());

CREATE POLICY creds_admin_all ON TBL_CREDS
  FOR ALL TO app_admin
  USING (true) WITH CHECK (true);

-- ── GRANT ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TBL_CREDS TO app_user;
GRANT SELECT ON TBL_IFMAS TO app_user, app_admin;

GRANT ALL ON TBL_CREDS TO app_admin;
GRANT ALL ON TBL_IFMAS TO app_admin;
