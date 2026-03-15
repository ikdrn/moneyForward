"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "@/lib/api-client";
import type {
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "@/types/bindings";

const QUERY_KEY = ["transactions"] as const;

export function useTransactions() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: transactionApi.list });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn:  () => transactionApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTransactionRequest) => transactionApi.create(body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTransactionRequest) => transactionApi.update(id, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
