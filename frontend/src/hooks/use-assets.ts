import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetApi } from "@/lib/api-client";
import type { CreateAssetRequest, UpdateAssetRequest } from "@/types/bindings";

export const ASSETS_KEY = ["assets"] as const;

export function useAssets() {
  return useQuery({ queryKey: ASSETS_KEY, queryFn: assetApi.list });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssetRequest) => assetApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ASSETS_KEY }); },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAssetRequest }) =>
      assetApi.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ASSETS_KEY }); },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ASSETS_KEY }); },
  });
}
