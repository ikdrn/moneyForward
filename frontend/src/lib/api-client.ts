import axios from "axios";
import { createClient } from "@/lib/supabase";
import type {
  Transaction, CreateTransactionRequest, UpdateTransactionRequest,
  Category,    CreateCategoryRequest,
  Asset,       CreateAssetRequest,    UpdateAssetRequest,
  Balance,     CreateBalanceRequest,  UpdateBalanceRequest,
  Account,     CreateAccountRequest,
  TrendPoint,  NetWorth,
} from "@/types/bindings";

export const apiClient = axios.create({ baseURL: "/api/v1" });

// Supabase セッションから JWT を自動付与
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// ── TBL_TRANS ────────────────────────────────────────────────
export const transactionApi = {
  list:   ()                                       => apiClient.get<Transaction[]>("/transactions").then((r) => r.data),
  create: (body: CreateTransactionRequest)         => apiClient.post<Transaction>("/transactions", body).then((r) => r.data),
  update: (id: string, body: UpdateTransactionRequest) => apiClient.patch<Transaction>(`/transactions/${id}`, body).then((r) => r.data),
  remove: (id: string)                             => apiClient.delete(`/transactions/${id}`),
};

// ── TBL_CATEG ────────────────────────────────────────────────
export const categoryApi = {
  list:   ()                            => apiClient.get<Category[]>("/categories").then((r) => r.data),
  create: (body: CreateCategoryRequest) => apiClient.post<Category>("/categories", body).then((r) => r.data),
};

// ── TBL_ASSET ────────────────────────────────────────────────
export const assetApi = {
  list:   ()                                   => apiClient.get<Asset[]>("/assets").then((r) => r.data),
  create: (body: CreateAssetRequest)           => apiClient.post<Asset>("/assets", body).then((r) => r.data),
  update: (id: string, body: UpdateAssetRequest) => apiClient.patch<Asset>(`/assets/${id}`, body).then((r) => r.data),
  remove: (id: string)                         => apiClient.delete(`/assets/${id}`),
};

// ── TBL_BALAN ────────────────────────────────────────────────
export const balanceApi = {
  list:   (astid?: string)                     => apiClient.get<Balance[]>("/balances", { params: astid ? { astid } : {} }).then((r) => r.data),
  create: (body: CreateBalanceRequest)         => apiClient.post<Balance>("/balances", body).then((r) => r.data),
  update: (id: string, body: UpdateBalanceRequest) => apiClient.patch<Balance>(`/balances/${id}`, body).then((r) => r.data),
  remove: (id: string)                         => apiClient.delete(`/balances/${id}`),
};

// ── TBL_ACCTS ────────────────────────────────────────────────
export const accountApi = {
  list:   ()                                => apiClient.get<Account[]>("/accounts").then((r) => r.data),
  create: (body: CreateAccountRequest)      => apiClient.post<Account>("/accounts", body).then((r) => r.data),
  remove: (id: string)                      => apiClient.delete(`/accounts/${id}`),
  sync:   (id: string)                      => apiClient.post(`/accounts/${id}/sync`).then((r) => r.data),
};

// ── 純資産 ───────────────────────────────────────────────────
export const networthApi = {
  get: () => apiClient.get<NetWorth>("/networth").then((r) => r.data),
};

// ── 資産推移 ─────────────────────────────────────────────────
export const trendApi = {
  get: () => apiClient.get<TrendPoint[]>("/trend").then((r) => r.data),
};
