export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type ValidationErrors = Record<string, string[]>;

/** Standard Laravel API envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: ValidationErrors;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  sort?: string;
  direction?: "asc" | "desc";
}
