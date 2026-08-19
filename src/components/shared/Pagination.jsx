import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../../styles/Pagination.css";

/**
 * Shared pagination control, driven entirely by server-reported totals.
 * Used by Courses, Complaints, and Books so the "load more pages" UX is
 * identical everywhere instead of three slightly-different implementations.
 *
 * Props: page, pages, total, limit, onPageChange(n)
 */
export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (!pages || pages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(page * limit, total);
  const pageNumbers = buildPageList(page, pages);

  return (
    <div className="ap-pagination">
      <span className="ap-pagination-info">
        Showing {start}–{end} of {total}
      </span>

      <div className="ap-pagination-controls">
        <button
          className="ap-pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>

        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="ap-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`ap-pagination-btn ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="ap-pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

// Compact page list, e.g. [1, "…", 4, 5, 6, "…", 12]
function buildPageList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i);
  }
  if (range[0] > 1) {
    range.unshift(1);
    if (range[1] > 2) range.splice(1, 0, "…");
  }
  if (range[range.length - 1] < total) {
    if (range[range.length - 1] < total - 1) range.push("…");
    range.push(total);
  }
  return range;
}
