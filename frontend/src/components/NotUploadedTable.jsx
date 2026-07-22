import React, { useState } from 'react';
import Pagination from './Pagination';
import '../styles/Tables.css';

function NotUploadedTable({
  data,
  loading,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) {
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

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

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  const getStatusClass = (dueDate) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const due = new Date(dueDate).setHours(0, 0, 0, 0);
    if (due < today) return 'overdue';
    if (due === today) return 'due-today';
    return 'pending';
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
        <div className="empty-icon">✓</div>
        <h3>All B-Forms Uploaded!</h3>
        <p>There are no pending B-Forms for the selected period and filters.</p>
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
              <th onClick={() => handleSort('assignedTo')}>
                Assigned To
                <SortIcon field="assignedTo" />
              </th>
              <th onClick={() => handleSort('dueDate')}>
                Due Date
                <SortIcon field="dueDate" />
              </th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const statusClass = getStatusClass(item.dueDate);
              return (
                <tr key={`${item.bFormNumber}-${index}`} className={`table-row ${statusClass}`}>
                  <td className="cell-bform">
                    <span className="bform-number">{item.bFormNumber}</span>
                  </td>
                  <td className="cell-company">
                    <span className="company-name">{item.companyName}</span>
                  </td>
                  <td className="cell-user">
                    <span className="user-avatar">{item.assignedTo.charAt(0)}</span>
                    <span className="user-name">{item.assignedTo}</span>
                  </td>
                  <td className="cell-date">
                    {new Date(item.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="cell-priority">
                    <span className={`priority-badge ${getPriorityClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="cell-status">
                    {statusClass === 'overdue' && (
                      <span className="status-badge status-danger">
                        ⚠ Overdue
                      </span>
                    )}
                    {statusClass === 'due-today' && (
                      <span className="status-badge status-warning">
                        ⏳ Due Today
                      </span>
                    )}
                    {statusClass === 'pending' && (
                      <span className="status-badge status-info">
                        ◐ Pending
                      </span>
                    )}
                  </td>
                  <td className="cell-action">
                    <button
                      className="action-btn"
                      onClick={() => handleAssign(item)}
                      aria-label={`Assign ${item.bFormNumber}`}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              );
            })}
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

function handleAssign(item) {
  console.log('Assign B-Form:', item);
  // Implement assignment modal or workflow
}

export default NotUploadedTable;
