import "./css/index.css";

/**
 * Generic row of filter dropdowns, driven entirely by config so every
 * management page can define its own filters without a new component.
 *
 * Props:
 *  - filters: current filter values object (from useListQuery)
 *  - onChange: (key, value) => void
 *  - onReset: () => void
 *  - config: [{ key, label, options: [{ value, label }] }]
 *  - showReset?: bool — show the reset button only when something is active
 */
const FilterBar = ({ filters, onChange, onReset, config, showReset = true }) => {
  const hasActive = config.some((f) => filters[f.key] && filters[f.key] !== "all");

  return (
    <div className="filter-bar">
      {config.map((f) => (
        <div className="filter-select-wrap" key={f.key}>
          <select
            className="filter-select"
            value={filters[f.key] || "all"}
            onChange={(e) => onChange(f.key, e.target.value)}
            aria-label={f.label}
          >
            <option value="all">{f.label}: All</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {showReset && hasActive && (
        <button className="filter-reset-btn" onClick={onReset}>
          Reset filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;
