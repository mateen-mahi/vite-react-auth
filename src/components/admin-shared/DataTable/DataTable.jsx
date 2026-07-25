import Spinner from "../Spinner/Spinner";
import EmptyState from "../EmptyState/EmptyState";
import "./DataTable.css";

/**
 * Generic table.
 *
 * columns: [{ key, label, render?: (row) => node, width?: string }]
 * data: array of row objects
 * keyField: string, default "_id"
 * selectable: bool — adds checkbox column
 * selectedIds: Set
 * onToggleRow: (id) => void
 * onToggleAll: () => void
 * allSelected: bool
 * actions: (row) => node  — rendered in the last column
 * loading: bool
 * emptyProps: props passed to <EmptyState />
 */
const DataTable = ({
  columns,
  data,
  keyField = "_id",
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allSelected,
  actions,
  loading,
  emptyProps,
}) => {
  if (loading) {
    return <Spinner label="Loading data…" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState {...emptyProps} />;
  }

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
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
            {actions && <th className="dt-actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const id = row[keyField];
            return (
              <tr key={id}>
                {selectable && (
                  <td className="dt-checkbox-col">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds?.has(id) || false}
                      onChange={() => onToggleRow(id)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
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
