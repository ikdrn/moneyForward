import { useQuery } from "@tanstack/react-query";
import { trendApi } from "@/lib/api-client";

export function useTrend() {
  return useQuery({
    queryKey: ["trend"],
    queryFn:  trendApi.get,
  });
}
