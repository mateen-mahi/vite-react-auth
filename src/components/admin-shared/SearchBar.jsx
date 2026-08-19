import { FiSearch, FiX } from "react-icons/fi";
import "./css/index.css";

/**
 * Controlled search input. Debouncing lives in useListQuery — this
 * component just reflects `value` and calls `onChange` on every keystroke.
 */
const SearchBar = ({ value, onChange, placeholder = "Search…" }) => {
  return (
    <div className="search-bar">
      <FiSearch className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange("")} aria-label="Clear search">
          <FiX />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
