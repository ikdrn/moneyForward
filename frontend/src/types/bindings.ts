// =============================================================
// bindings.ts  ·  全エンティティの TypeScript 型定義
// DB規約: テーブル名9文字固定 / カラム名5文字固定
// =============================================================

// ── ユーザ (TBL_USERS) ───────────────────────────────────────
export type UserRole = "app_user" | "app_admin";

export interface User {
  objid: string;    // UUID
  email: string;
  roles: UserRole;
  ctime: string;    // ISO 8601
}

// ── 科目 (TBL_CATEG) ─────────────────────────────────────────
export interface Category {
  objid: string;
  ownid: string;
  cname: string;
  ctype: "income" | "expense";
  ctime: string;
}

export interface CreateCategoryRequest {
  cname: string;
  ctype: "income" | "expense";
}

// ── 収支明細 (TBL_TRANS) ─────────────────────────────────────
export interface Transaction {
  objid: string;
  ownid: string;
  catid: string;
  amnts: string;    // Decimal → string (精度保持)
  dates: string;    // YYYY-MM-DD
  ctime: string;
}

export interface CreateTransactionRequest {
  catid: string;
  amnts: string;
  dates: string;
}

export interface UpdateTransactionRequest {
  catid?: string;
  amnts?: string;
  dates?: string;
}

// ── 資産マスタ (TBL_ASSET) ───────────────────────────────────
export type AssetType = "bank" | "fund";

export interface Asset {
  objid: string;
  ownid: string;
  aname: string;    // 口座名・ファンド名
  atype: AssetType; // bank=銀行口座 | fund=投資信託
  ctime: string;
}

export interface CreateAssetRequest {
  aname: string;
  atype: AssetType;
}

export interface UpdateAssetRequest {
  aname?: string;
  atype?: AssetType;
}

// ── 残高履歴 (TBL_BALAN) ─────────────────────────────────────
export interface Balance {
  objid: string;
  ownid: string;
  astid: string;    // FK → TBL_ASSET.objid
  amnts: string;    // Numeric → string (精度保持)
  dates: string;    // YYYY-MM-DD
  ctime: string;
}

export interface CreateBalanceRequest {
  astid: string;
  amnts: string;
  dates: string;
}

export interface UpdateBalanceRequest {
  amnts?: string;
  dates?: string;
}

// ── 資産推移 (集計結果) ───────────────────────────────────────
// GET /api/v1/trend が返す時系列データ点
// フィールド名も5文字固定で統一
export interface TrendPoint {
  dates: string;  // YYYY-MM-DD
  total: string;  // 全資産合計
  bktot: string;  // 銀行口座合計 (bank total)
  fdtot: string;  // 投資信託合計 (fund total)
}

// ── 監査ログ (TBL_AUDIT) ─────────────────────────────────────
export interface AuditLog {
  objid: string;
  ownid: string | null;
  actio: string;
  ctime: string;
}
