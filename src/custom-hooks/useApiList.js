import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import useDebouncedValue from "./useDebouncedValue";

/**
 * useApiList — shared hook for any paginated/sorted/filtered/searchable
 * list endpoint (courses, complaints, books, ...). Mirrors the query-param
 * pattern documented in the backend's pagination reference: page, limit,
 * sortBy, order, search, plus whatever extra filters the endpoint accepts.
 *
 * - Search is debounced (400ms default); filter/sort changes fire right away.
 * - Changing search, any filter, or sortBy/order always resets to page 1.
 * - `total`/`pages` always come from the API response, never computed
 *   locally — see parseResponse.
 *
 * Usage:
 *   const list = useApiList({
 *     endpoint: "/courses",
 *     limit: 9,
 *     defaultSortBy: "createdAt",
 *     defaultOrder: "desc",
 *     initialFilters: { category: "", level: "" },
 *     parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
 *   });
 */
export default function useApiList({
  endpoint,
  limit: initialLimit = 10,
  defaultSortBy = "createdAt",
  defaultOrder = "desc",
  initialFilters = {},
  parseResponse,
  searchDebounceMs = 400,
  enabled = true,
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const search = useDebouncedValue(searchInput, searchDebounceMs);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestId = useRef(0);
  const filtersKey = JSON.stringify(filters);

  // Reset to page 1 whenever search, filters, or sorting change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
  }, [search, filtersKey, sortBy, order, limit]);

  const fetchList = useCallback(async () => {
    if (!enabled) return;
    const myId = ++requestId.current;
    setLoading(true);
    setError(null);

    const params = { page, limit, sortBy, order };
    if (search) params.search = search;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) params[key] = value;
    });

    try {
      const res = await api.get(endpoint, { params });
      if (myId !== requestId.current) return; // a newer request already landed
      const parsed = parseResponse(res.data);
      setItems(parsed.items || []);
      setTotal(parsed.total || 0);
      setPages(Math.max(parsed.pages || 1, 1));
    } catch (err) {
      if (myId !== requestId.current) return;
      setError(err.response?.data?.message || "Failed to load data.");
      setItems([]);
      setTotal(0);
      setPages(1);
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, limit, sortBy, order, search, filtersKey, enabled]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items,
    total,
    pages,
    page,
    setPage,
    limit,
    setLimit,
    sortBy,
    setSortBy,
    order,
    setOrder,
    search: searchInput,
    setSearch: setSearchInput,
    filters,
    setFilter,
    resetFilters,
    loading,
    error,
    refetch: fetchList,
  };
}
