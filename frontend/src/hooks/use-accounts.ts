import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "@/lib/api-client";
import type { CreateAccountRequest } from "@/types/bindings";

export const ACCOUNTS_KEY = ["accounts"] as const;

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: accountApi.list });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountRequest) => accountApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }); },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      qc.invalidateQueries({ queryKey: ["networth"] });
      qc.invalidateQueries({ queryKey: ["trend"] });
    },
  });
}

export function useSyncAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.sync(id),
    onSuccess: () => {
      // 2秒後に再フェッチ (Rust ジョブが処理完了する時間を考慮)
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
        qc.invalidateQueries({ queryKey: ["networth"] });
        qc.invalidateQueries({ queryKey: ["trend"] });
      }, 2000);
    },
  });
}
