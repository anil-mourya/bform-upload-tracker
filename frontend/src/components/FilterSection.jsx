import React, { useState } from 'react';
import '../styles/FilterSection.css';

function FilterSection({ period, setPeriod, year, setYear, onApply }) {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setShowCustomDate(false);
    }
  };

  const handleApply = () => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      alert('Please select both start and end dates');
      return;
    }
    onApply();
  };

  return (
    <div className="filter-section">
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="period-select" className="filter-label">Period</label>
          <div className="period-buttons">
            <button
              className={`period-btn ${period === 'jan-jun' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('jan-jun')}
              aria-pressed={period === 'jan-jun'}
            >
              Jan - Jun
            </button>
            <button
              className={`period-btn ${period === 'jul-dec' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('jul-dec')}
              aria-pressed={period === 'jul-dec'}
            >
              Jul - Dec
            </button>
            <button
              className={`period-btn ${period === 'custom' ? 'active' : ''}`}
              onClick={() => {
                handlePeriodChange('custom');
                setShowCustomDate(true);
              }}
              aria-pressed={period === 'custom'}
            >
              Custom
            </button>
          </div>
        </div>

        {showCustomDate && (
          <div className="custom-date-section">
            <div className="date-input-group">
              <label htmlFor="start-date" className="date-label">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="end-date" className="date-label">End Date</label>
              <input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="year-select" className="filter-label">Year</label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="year-select"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-apply"
          onClick={handleApply}
          aria-label="Apply filters"
        >
          Apply Filters
        </button>
      </div>

      <div className="filter-summary">
        <span className="summary-text">
          {period === 'custom' && customStartDate && customEndDate
            ? `${customStartDate} to ${customEndDate}`
            : period === 'jan-jun'
            ? 'January - June'
            : 'July - December'
          } {year}
        </span>
      </div>
    </div>
  );
}

export default FilterSection;
