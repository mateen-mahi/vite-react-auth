import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./css/index.css";

/**
 * Pagination driven entirely by server-reported totals — page/pages/total
 * come straight from the API response (via useListQuery), never computed
 * from a locally-filtered array.
 *
 * Props: page, pages, total, onPageChange(n), limit?, onLimitChange?(n),
 * limitOptions?
 */
const Pagination = ({
  page,
  pages,
  total,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [10, 20, 50],
}) => {
  if (!pages || pages <= 0) pages = 1;

  const start = total === 0 ? 0 : (page - 1) * (limit || 10) + 1;
  const end = total === 0 ? 0 : Math.min(page * (limit || 10), total);

  const pageNumbers = buildPageList(page, pages);

  return (
    <div className="pagination">
      <span className="pagination-total">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </span>

      {onLimitChange && (
        <select
          className="pagination-size-select"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {limitOptions.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      )}

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>

        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-btn${p === page ? " active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

// Builds a compact page list like [1, "…", 4, 5, 6, "…", 12]
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

export default Pagination;
