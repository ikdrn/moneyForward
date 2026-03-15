import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { balanceApi } from "@/lib/api-client";
import type { CreateBalanceRequest, UpdateBalanceRequest } from "@/types/bindings";

export const BALANCES_KEY = (astid?: string) =>
  astid ? ["balances", astid] : ["balances"];

export function useBalances(astid?: string) {
  return useQuery({
    queryKey: BALANCES_KEY(astid),
    queryFn:  () => balanceApi.list(astid),
  });
}

export function useCreateBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBalanceRequest) => balanceApi.create(body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: BALANCES_KEY(vars.astid) });
      qc.invalidateQueries({ queryKey: BALANCES_KEY() });
      qc.invalidateQueries({ queryKey: ["trend"] });
    },
  });
}

export function useUpdateBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBalanceRequest }) =>
      balanceApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BALANCES_KEY() });
      qc.invalidateQueries({ queryKey: ["trend"] });
    },
  });
}

export function useDeleteBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => balanceApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BALANCES_KEY() });
      qc.invalidateQueries({ queryKey: ["trend"] });
    },
  });
}
