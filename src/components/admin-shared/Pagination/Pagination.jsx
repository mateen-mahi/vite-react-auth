import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./Pagination.css";

/**
 * page: current page (1-indexed)
 * pages: total page count
 * onPageChange: (nextPage) => void
 */
const Pagination = ({ page, pages, onPageChange, total }) => {
  if (!pages || pages <= 1) return null;

  const getPageNumbers = () => {
    const nums = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(pages, page + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  return (
    <div className="pagination">
      {typeof total === "number" && (
        <span className="pagination-total">{total} total</span>
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

        {getPageNumbers()[0] > 1 && (
          <>
            <button className="pagination-btn" onClick={() => onPageChange(1)}>
              1
            </button>
            {getPageNumbers()[0] > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}

        {getPageNumbers().map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {getPageNumbers()[getPageNumbers().length - 1] < pages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < pages - 1 && (
              <span className="pagination-ellipsis">…</span>
            )}
            <button className="pagination-btn" onClick={() => onPageChange(pages)}>
              {pages}
            </button>
          </>
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

export default Pagination;
