import { useState, useEffect } from "react";
import api from "../services/api";
import useApiList from "../custom-hooks/useApiList.js";
import Pagination from "../components/shared/Pagination";
import {
  FiSearch, FiBook, FiCalendar, FiExternalLink,
  FiRefreshCw, FiAlertCircle, FiFileText, FiFolder,
} from "react-icons/fi";
import "../styles/books.css";

const PAGE_SIZE = 12;

// UI sort labels -> real API sortBy/order pairs.
// GET /api/books only whitelists title | createdAt | updatedAt for sortBy.
const SORT_OPTIONS = [
  { value: "newest",   label: "Newest",          sortBy: "createdAt", order: "desc" },
  { value: "oldest",   label: "Oldest",           sortBy: "createdAt", order: "asc" },
  { value: "title-az", label: "Title: A to Z",    sortBy: "title",     order: "asc" },
  { value: "title-za", label: "Title: Z to A",    sortBy: "title",     order: "desc" },
  { value: "updated",  label: "Recently Updated", sortBy: "updatedAt", order: "desc" },
];

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

// Books may reference their course either populated (object) or as a raw id.
const courseTitleOf = (book) =>
  typeof book.courseId === "object" && book.courseId ? book.courseId.title : null;

// Different backends/seed data use different field names for the actual
// file link — check the common ones so the "Open" button just works.
const fileUrlOf = (book) => book.document?.fileUrl || book.document?.pdfUrl || book.document?.url || book.document?.link || null;

export default function Books() {
  // GET /api/books — sortable: title | createdAt | updatedAt.
  // Filters: courseId, search (title).
  const list = useApiList({
    endpoint: "/books",
    limit: PAGE_SIZE,
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    initialFilters: { courseId: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  const [sort, setSort] = useState("newest");
  useEffect(() => {
    const opt = SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0];
    list.setSortBy(opt.sortBy);
    list.setOrder(opt.order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Course filter options — fetched once, independent of the books list.
  const [courseOptions, setCourseOptions] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/courses", { params: { limit: 100, sortBy: "title", order: "asc" } });
        setCourseOptions(res.data.data || []);
      } catch (err) {
        console.log("Failed to fetch courses for filter:", err);
      }
    })();
  }, []);

  const hasActiveQuery = !!list.search || !!list.filters.courseId;

  return (
    <div className="books-page">

      {/* ── Page Header ── */}
      <div className="books-header">
        <div>
          <h1 className="books-title">Books</h1>
          <p className="books-subtitle">Browse reading material and reference books linked to your courses.</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="books-filters">
        <div className="books-search-wrap">
          <FiSearch className="books-search-icon" />
          <input
            className="books-search"
            placeholder="Search books by title…"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
          />
          {list.loading && <FiRefreshCw className="books-search-spinner cp-spin" />}
        </div>

        <div className="books-selects">
          <select
            className="books-select"
            value={list.filters.courseId}
            onChange={(e) => list.setFilter("courseId", e.target.value)}
          >
            <option value="">All Courses</option>
            {courseOptions.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>

          <select className="books-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Results ── */}
      {list.loading && (
        <p className="books-count"><FiRefreshCw className="cp-spin" /> Loading books…</p>
      )}

      {!list.loading && list.error && (
        <p className="books-count"><FiAlertCircle /> {list.error}</p>
      )}

      {!list.loading && !list.error && (
        <>
          <p className="books-count">
            {list.total === 0
              ? hasActiveQuery ? "No books match your search or filter." : "No books available yet."
              : `${list.total} book${list.total !== 1 ? "s" : ""}`}
          </p>

          {list.items.length > 0 && (
            <>
              <div className="books-grid">
                {list.items.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>

              <Pagination
                page={list.page}
                pages={list.pages}
                total={list.total}
                limit={list.limit}
                onPageChange={list.setPage}
              />
            </>
          )}

          {list.items.length === 0 && (
            <div className="books-empty">
              <FiBook className="books-empty-icon" />
              <p className="books-empty-title">No books found</p>
              <p className="books-empty-sub">
                {hasActiveQuery ? "Try a different search term or course filter." : "Check back once books have been added."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Book card ─────────────────────────────────────────────
function BookCard({ book }) {
  const courseTitle = courseTitleOf(book);
  const fileUrl = fileUrlOf(book);

  return (
    <div className="book-card">
      <div className="book-card-thumb">
        <FiBook className="book-card-icon" />
      </div>

      <div className="book-card-body">
        {courseTitle && (
          <span className="book-card-course"><FiFolder /> {courseTitle}</span>
        )}
        <h3 className="book-card-title">{book.title}</h3>
        {book.description && (
          <p className="book-card-desc">{book.description}</p>
        )}

        <div className="book-card-meta">
          <span><FiCalendar /> {formatDate(book.createdAt)}</span>
        </div>
      </div>

      <div className="book-card-footer">
        {fileUrl ? (
          <a className="book-card-btn" href={fileUrl} target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> Open Book
          </a>
        ) : (
          <button className="book-card-btn disabled" disabled>
            <FiFileText /> No File Attached
          </button>
        )}
      </div>
    </div>
  );
}
