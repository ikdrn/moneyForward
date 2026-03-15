// =============================================================
// bindings.ts  ·  ts-rs で自動生成される型の手動配置版
// 本番では `cargo test` 後に backend/bindings/ からコピーする
// =============================================================

export type UserRole = "app_user" | "app_admin";

export interface User {
  id___: string;    // UUID
  email: string;
  role_: UserRole;
  ctime: string;    // ISO 8601
}

export interface Category {
  id___: string;
  ownid: string;
  cname: string;
  ctype: "income" | "expense";
  ctime: string;
}

export interface Transaction {
  id___: string;
  ownid: string;
  catid: string;
  amnts: string;    // Decimal → string (精度保持)
  dates: string;    // YYYY-MM-DD
  ctime: string;
}

export interface AuditLog {
  id___: string;
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
