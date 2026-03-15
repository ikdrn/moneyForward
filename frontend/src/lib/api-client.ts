import axios from "axios";
import type {
  Transaction, CreateTransactionRequest, UpdateTransactionRequest,
  Category,    CreateCategoryRequest,
  Asset,       CreateAssetRequest,    UpdateAssetRequest,
  Balance,     CreateBalanceRequest,  UpdateBalanceRequest,
  TrendPoint,
} from "@/types/bindings";

// Next.js API Routes が同一オリジンにあるので相対パスで良い
export const apiClient = axios.create({ baseURL: "/api/v1" });

// JWT を localStorage から自動付与
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── TBL_TRANS ────────────────────────────────────────────────
export const transactionApi = {
  list:   ()                                  => apiClient.get<Transaction[]>("/transactions").then((r) => r.data),
  get:    (id: string)                        => apiClient.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
  create: (body: CreateTransactionRequest)    => apiClient.post<Transaction>("/transactions", body).then((r) => r.data),
  update: (id: string, body: UpdateTransactionRequest) => apiClient.patch<Transaction>(`/transactions/${id}`, body).then((r) => r.data),
  remove: (id: string)                        => apiClient.delete(`/transactions/${id}`),
};

// ── TBL_CATEG ────────────────────────────────────────────────
export const categoryApi = {
  list:   ()                            => apiClient.get<Category[]>("/categories").then((r) => r.data),
  create: (body: CreateCategoryRequest) => apiClient.post<Category>("/categories", body).then((r) => r.data),
};

// ── TBL_ASSET ────────────────────────────────────────────────
export const assetApi = {
  list:   ()                                  => apiClient.get<Asset[]>("/assets").then((r) => r.data),
  get:    (id: string)                        => apiClient.get<Asset>(`/assets/${id}`).then((r) => r.data),
  create: (body: CreateAssetRequest)          => apiClient.post<Asset>("/assets", body).then((r) => r.data),
  update: (id: string, body: UpdateAssetRequest) => apiClient.patch<Asset>(`/assets/${id}`, body).then((r) => r.data),
  remove: (id: string)                        => apiClient.delete(`/assets/${id}`),
};

// ── TBL_BALAN ────────────────────────────────────────────────
export const balanceApi = {
  list:   (astid?: string)                    =>
    apiClient.get<Balance[]>("/balances", { params: astid ? { astid } : undefined }).then((r) => r.data),
  get:    (id: string)                        => apiClient.get<Balance>(`/balances/${id}`).then((r) => r.data),
  create: (body: CreateBalanceRequest)        => apiClient.post<Balance>("/balances", body).then((r) => r.data),
  update: (id: string, body: UpdateBalanceRequest) => apiClient.patch<Balance>(`/balances/${id}`, body).then((r) => r.data),
  remove: (id: string)                        => apiClient.delete(`/balances/${id}`),
};

// ── 資産推移 (集計) ──────────────────────────────────────────
export const trendApi = {
  get: () => apiClient.get<TrendPoint[]>("/trend").then((r) => r.data),
};
