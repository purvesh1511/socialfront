import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

/** Shared search/filter/page state for admin tables. Changing a filter resets to page 1. */
export function useListState() {
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState("");
  const [status, setStatusValue] = useState("");
  const debouncedSearch = useDebounce(search);

  return {
    page,
    setPage,
    search,
    setSearch: (value: string) => {
      setSearchValue(value);
      setPage(1);
    },
    status,
    setStatus: (value: string) => {
      setStatusValue(value);
      setPage(1);
    },
    params: { page, search: debouncedSearch || undefined, status: status || undefined },
  };
}
