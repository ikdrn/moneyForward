// =============================================================
// bindings.ts  ·  ts-rs で自動生成される型の手動配置版
// 本番では `cargo test` 後に backend/bindings/ からコピーする
// =============================================================

export type UserRole = "app_user" | "app_admin";

export interface User {
  objid: string;    // UUID
  email: string;
  roles: UserRole;
  ctime: string;    // ISO 8601
}

export interface Category {
  objid: string;
  ownid: string;
  cname: string;
  ctype: "income" | "expense";
  ctime: string;
}

export interface Transaction {
  objid: string;
  ownid: string;
  catid: string;
  amnts: string;    // Decimal → string (精度保持)
  dates: string;    // YYYY-MM-DD
  ctime: string;
}

export interface AuditLog {
  objid: string;
  ownid: string | null;
  actio: string;
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

export interface CreateCategoryRequest {
  cname: string;
  ctype: "income" | "expense";
}
