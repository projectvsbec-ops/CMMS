import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "./api";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => globalSearch(query),
    enabled: query.length >= 2,
    staleTime: 60000,
  });
}
