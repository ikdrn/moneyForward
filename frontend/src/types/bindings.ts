// =============================================================
// bindings.ts  ·  全エンティティの TypeScript 型定義
// DB規約: テーブル名9文字固定 / カラム名5文字固定
// =============================================================

export type UserRole = "app_user" | "app_admin";

// ── TBL_USERS ────────────────────────────────────────────────
export interface User {
  objid: string;
  email: string;
  roles: UserRole;
  ctime: string;
}

// ── TBL_CATEG ────────────────────────────────────────────────
export interface Category {
  objid: string;
  ownid: string;
  cname: string;
  ctype: "income" | "expense";
  ctime: string;
}
export interface CreateCategoryRequest { cname: string; ctype: "income" | "expense"; }

// ── TBL_TRANS ────────────────────────────────────────────────
export interface Transaction {
  objid: string;
  ownid: string;
  catid: string;
  amnts: string;   // Decimal → string
  dates: string;   // YYYY-MM-DD
  ctime: string;
}
export interface CreateTransactionRequest { catid: string; amnts: string; dates: string; }
export interface UpdateTransactionRequest { catid?: string; amnts?: string; dates?: string; }

// ── TBL_ASSET ────────────────────────────────────────────────
export type AssetType = "bank" | "fund";
export interface Asset {
  objid: string;
  ownid: string;
  aname: string;
  atype: AssetType;
  ctime: string;
}
export interface CreateAssetRequest { aname: string; atype: AssetType; }
export interface UpdateAssetRequest  { aname?: string; atype?: AssetType; }

// ── TBL_BALAN ────────────────────────────────────────────────
export interface Balance {
  objid: string;
  ownid: string;
  astid: string;
  amnts: string;
  dates: string;
  ctime: string;
}
export interface CreateBalanceRequest { astid: string; amnts: string; dates: string; }
export interface UpdateBalanceRequest { amnts?: string; dates?: string; }

// ── TBL_ACCTS ────────────────────────────────────────────────
export type AccountInstType = "bank" | "brok" | "card";
export type AccountState    = "idle" | "sync" | "done" | "erro";

export interface Account {
  objid: string;
  ownid: string;
  astid: string;
  iname: string;      // 金融機関名
  itype: AccountInstType;
  state: AccountState;
  lsync: string | null; // 最終同期日時
  ctime: string;
  aname: string;      // 対応資産名 (JOIN)
  amnts: string | null; // 最新残高 (集計)
  dates: string | null; // 最新残高日付
}
export interface CreateAccountRequest { iname: string; itype: AccountInstType; aname: string; }

// ── 純資産 (集計) ─────────────────────────────────────────────
// GET /api/v1/networth のレスポンス
// フィールド名も5文字固定
export interface NetWorth {
  bkttl: string;  // 銀行口座合計 (bank total)
  fdttl: string;  // 投資信託合計 (fund total)
  total: string;  // 純資産合計
  lasdt: string | null; // 最終更新日
  prevt: string;  // 前月合計 (変化率計算用)
}

// ── 資産推移 (集計) ───────────────────────────────────────────
// GET /api/v1/trend のレスポンス
export interface TrendPoint {
  dates: string;  // YYYY-MM-DD
  total: string;  // 全資産合計
  bktot: string;  // 銀行口座合計
  fdtot: string;  // 投資信託合計
}

// ── TBL_AUDIT ────────────────────────────────────────────────
export interface AuditLog {
  objid: string;
  ownid: string | null;
  actio: string;
  ctime: string;
}
