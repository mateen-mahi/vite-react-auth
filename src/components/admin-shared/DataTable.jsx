import { FiChevronUp, FiChevronDown, FiChevronsUp } from "react-icons/fi";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import "./css/index.css";

/**
 * Generic data table used by every management page.
 *
 * Props:
 *  - columns: [{ key, label, sortable?, render?(row) }]
 *  - data: row[]
 *  - loading: bool
 *  - selectable: bool
 *  - selectedIds, onToggleRow(id), onToggleAll(), allSelected
 *  - sortBy, order, onSort(key)   — pass these to enable clickable headers
 *  - actions(row) -> node          — rendered as the last column
 *  - emptyProps: props for <EmptyState />
 *  - rowKey: (row) => string       — defaults to row._id
 */
const DataTable = ({
  columns,
  data,
  loading,
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allSelected,
  sortBy,
  order,
  onSort,
  actions,
  emptyProps,
  rowKey = (row) => row._id,
}) => {
  if (loading) return <Spinner label="Loading…" />;
  if (!data || data.length === 0) return <EmptyState {...emptyProps} />;

  return (
    <div className="data-table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="dt-checkbox-col">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={!!allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all rows on this page"
                />
              </th>
            )}
            {columns.map((col) => {
              const isSortable = !!col.sortable && !!onSort;
              const isActive = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  className={isSortable ? `dt-sortable${isActive ? " active" : ""}` : ""}
                  onClick={isSortable ? () => onSort(col.key) : undefined}
                >
                  {isSortable ? (
                    <span className="dt-th-inner">
                      {col.label}
                      <span className="dt-sort-icon">
                        {isActive ? (
                          order === "asc" ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )
                        ) : (
                          <FiChevronsUp style={{ opacity: 0.4 }} />
                        )}
                      </span>
                    </span>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
            {actions && <th className="dt-actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const id = rowKey(row);
            return (
              <tr key={id}>
                {selectable && (
                  <td className="dt-checkbox-col">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds?.has(id)}
                      onChange={() => onToggleRow(id)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label}>
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
                {actions && <td className="dt-actions-col">{actions(row)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
