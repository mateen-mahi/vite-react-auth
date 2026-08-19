import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";

/**
 * useListQuery — the single hook every management page uses to fetch a
 * paginated, sorted, filtered, searchable list from the API.
 *
 * It owns page/limit/sortBy/order/search/filters state, debounces the
 * search box, resets to page 1 whenever search/filters/sort change (never
 * on a plain page change), builds the query string, and calls the given
 * endpoint. Response shapes differ slightly across your existing endpoints
 * (e.g. users -> { users, totalUsers, totalPages }, others -> { data,
 * total, pages }) so you pass a small `parseResponse` adapter per page.
 *
 * Usage:
 *   const list = useListQuery({
 *     endpoint: "/users/all-users",
 *     defaultSortBy: "createdAt",
 *     defaultOrder: "desc",
 *     limit: 10,
 *     parseResponse: (data) => ({
 *       items: data.users,
 *       total: data.totalUsers,
 *       pages: data.totalPages,
 *     }),
 *   });
 *
 *   list.items, list.total, list.pages, list.page, list.loading, list.error
 *   list.search, list.setSearch(v)
 *   list.filters, list.setFilter(key, value), list.resetFilters()
 *   list.sortBy, list.order, list.toggleSort(field)
 *   list.setPage(n), list.limit, list.setLimit(n)
 *   list.refetch()
 */
export default function useListQuery({
  endpoint,
  defaultSortBy = "createdAt",
  defaultOrder = "desc",
  limit: initialLimit = 10,
  initialFilters = {},
  parseResponse,
  searchDebounceMs = 350,
  enabled = true,
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearchDebounced] = useState("");

  const [filters, setFilters] = useState(initialFilters);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestId = useRef(0);

  // Debounce the raw search input into `search`, which is what actually
  // triggers a fetch.
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), searchDebounceMs);
    return () => clearTimeout(t);
  }, [searchInput, searchDebounceMs]);

  // Any change to search/filters/sort/limit should snap back to page 1.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
  }, [search, JSON.stringify(filters), sortBy, order, limit]);

  const fetchList = useCallback(async () => {
    if (!enabled) return;
    const myId = ++requestId.current;
    setLoading(true);
    setError(null);

    const params = { page, limit, sortBy, order };
    if (search) params.search = search;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && value !== "all") {
        params[key] = value;
      }
    });

    try {
      const res = await api.get(endpoint, { params });
      if (myId !== requestId.current) return; // stale response, ignore
      const parsed = parseResponse
        ? parseResponse(res.data)
        : {
            items: res.data.items || res.data.data || [],
            total: res.data.total || 0,
            pages: res.data.pages || 1,
          };
      setItems(parsed.items || []);
      setTotal(parsed.total || 0);
      setPages(Math.max(parsed.pages || 1, 1));
    } catch (err) {
      if (myId !== requestId.current) return;
      setError(err.response?.data?.message || "Failed to load data");
      setItems([]);
      setTotal(0);
      setPages(1);
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, limit, sortBy, order, search, JSON.stringify(filters), enabled]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleSort = useCallback((field) => {
    setSortBy((prevField) => {
      setOrder((prevOrder) => (prevField === field ? (prevOrder === "asc" ? "desc" : "asc") : "asc"));
      return field;
    });
  }, []);

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
    order,
    toggleSort,
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
