import React, { useState } from 'react';
import Pagination from './Pagination';
import '../styles/Tables.css';

function UploadedTable({
  data,
  loading,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) {
  const [sortField, setSortField] = useState('uploadDate');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    return sortDirection === 'asc'
      ? <span className="sort-icon active">↑</span>
      : <span className="sort-icon active">↓</span>;
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <h3>No Uploaded B-Forms Found</h3>
        <p>There are no uploaded B-Forms for the selected period and filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('bFormNumber')}>
                B-Form Number
                <SortIcon field="bFormNumber" />
              </th>
              <th onClick={() => handleSort('companyName')}>
                Company Name
                <SortIcon field="companyName" />
              </th>
              <th onClick={() => handleSort('uploadedBy')}>
                Uploaded By
                <SortIcon field="uploadedBy" />
              </th>
              <th onClick={() => handleSort('uploadDate')}>
                Upload Date
                <SortIcon field="uploadDate" />
              </th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={`${item.bFormNumber}-${index}`} className="table-row">
                <td className="cell-bform">
                  <span className="bform-number">{item.bFormNumber}</span>
                </td>
                <td className="cell-company">
                  <span className="company-name">{item.companyName}</span>
                </td>
                <td className="cell-user">
                  <span className="user-avatar">{item.uploadedBy.charAt(0)}</span>
                  <span className="user-name">{item.uploadedBy}</span>
                </td>
                <td className="cell-date">
                  {new Date(item.uploadDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="cell-status">
                  <span className="status-badge status-success">
                    ✓ Uploaded
                  </span>
                </td>
                <td className="cell-action">
                  <button
                    className="action-btn"
                    onClick={() => handleViewDetails(item)}
                    aria-label={`View details for ${item.bFormNumber}`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function handleViewDetails(item) {
  console.log('View details for:', item);
  // Implement modal or navigation to details page
}

export default UploadedTable;
