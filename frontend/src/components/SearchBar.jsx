import React from 'react';
import '../styles/SearchBar.css';

function SearchBar({ value, onChange }) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search B-Forms, Company Name, or Assigned User..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input"
          aria-label="Search B-Forms"
        />
        {value && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {value && (
        <span className="search-results-hint">
          Showing results for "{value}"
        </span>
      )}
    </div>
  );
}

export default SearchBar;
