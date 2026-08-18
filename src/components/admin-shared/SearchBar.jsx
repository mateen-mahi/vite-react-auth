import { FiSearch, FiX } from "react-icons/fi";
import "./adminShared/SearchBar.css";

const SearchBar = ({ value, onChange, placeholder = "Search…" }) => {
  return (
    <div className="search-bar">
      <FiSearch className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
          type="button"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
