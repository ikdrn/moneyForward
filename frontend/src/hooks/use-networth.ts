import { useQuery } from "@tanstack/react-query";
import { networthApi } from "@/lib/api-client";

export function useNetWorth() {
  return useQuery({
    queryKey: ["networth"],
    queryFn:  networthApi.get,
    refetchInterval: 60_000, // 1分ごとに自動更新
  });
}
