import type { PaginatedResponse } from "@/lib/types";

export async function fetchAllPages<T>(
  fetcher: (page: string) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const first = await fetcher("1");
  const totalPages = Math.ceil(first.count / 20);
  if (totalPages <= 1) return first.results;
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetcher(String(i + 2)))
  );
  return [...first.results, ...rest.flatMap((r) => r.results)];
}
