export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type ListResponse<T> = T[] | PaginatedResponse<T> | { results: T[] };

export function unwrapList<T>(data: ListResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.results ?? []);
}
