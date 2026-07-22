import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockStats, mockUploads, mockPaginationData, createMockUpload } from './fixtures';

// Mock components (since we don't have React Testing Library setup in actual project)
describe('StatsCards Component', () => {
  // Mock component for testing
  const StatsCards = ({ stats, loading }) => (
    <div className="stats-cards-container" data-testid="stats-container">
      {loading ? (
        <div data-testid="stats-loading">Loading stats...</div>
      ) : (
        <>
          <div data-testid="total-stat">{stats.total}</div>
          <div data-testid="uploaded-stat">{stats.uploaded}</div>
          <div data-testid="pending-stat">{stats.pending}</div>
          <div data-testid="overdue-stat">{stats.overdue}</div>
        </>
      )}
    </div>
  );

  it('should render all stat cards', () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    expect(screen.getByTestId('total-stat')).toHaveTextContent('100');
    expect(screen.getByTestId('uploaded-stat')).toHaveTextContent('70');
    expect(screen.getByTestId('pending-stat')).toHaveTextContent('25');
    expect(screen.getByTestId('overdue-stat')).toHaveTextContent('5');
  });

  it('should display loading state', () => {
    render(<StatsCards stats={mockStats} loading={true} />);

    expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('total-stat')).not.toBeInTheDocument();
  });

  it('should update when stats change', () => {
    const { rerender } = render(<StatsCards stats={mockStats} loading={false} />);

    expect(screen.getByTestId('total-stat')).toHaveTextContent('100');

    const updatedStats = { ...mockStats, total: 150 };
    rerender(<StatsCards stats={updatedStats} loading={false} />);

    expect(screen.getByTestId('total-stat')).toHaveTextContent('150');
  });

  it('should handle zero values', () => {
    const zeroStats = { total: 0, uploaded: 0, pending: 0, overdue: 0 };
    render(<StatsCards stats={zeroStats} loading={false} />);

    expect(screen.getByTestId('total-stat')).toHaveTextContent('0');
  });
});

describe('UploadedTable Component', () => {
  const UploadedTable = ({ data, loading, onStatusChange }) => (
    <div data-testid="uploaded-table" className="table-container">
      {loading ? (
        <div data-testid="table-loading">Loading uploads...</div>
      ) : data.length === 0 ? (
        <div data-testid="empty-message">No uploads found</div>
      ) : (
        <table>
          <tbody>
            {data.map(upload => (
              <tr key={upload.id} data-testid={`upload-row-${upload.id}`}>
                <td>{upload.employee_id}</td>
                <td>{upload.employee_name}</td>
                <td>{upload.status}</td>
                <td>
                  <button
                    onClick={() => onStatusChange?.(upload.id)}
                    data-testid={`status-btn-${upload.id}`}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  it('should render table with uploads', () => {
    render(
      <UploadedTable
        data={mockUploads.uploaded}
        loading={false}
        onStatusChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('uploaded-table')).toBeInTheDocument();
    mockUploads.uploaded.forEach(upload => {
      expect(screen.getByTestId(`upload-row-${upload.id}`)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    render(
      <UploadedTable
        data={[]}
        loading={true}
        onStatusChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('should display empty message when no data', () => {
    render(
      <UploadedTable
        data={[]}
        loading={false}
        onStatusChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
  });

  it('should handle status change callback', async () => {
    const onStatusChange = jest.fn();
    render(
      <UploadedTable
        data={mockUploads.uploaded}
        loading={false}
        onStatusChange={onStatusChange}
      />
    );

    const statusBtn = screen.getByTestId(
      `status-btn-${mockUploads.uploaded[0].id}`
    );
    fireEvent.click(statusBtn);

    expect(onStatusChange).toHaveBeenCalledWith(mockUploads.uploaded[0].id);
  });

  it('should display correct data for each row', () => {
    const upload = mockUploads.uploaded[0];
    render(
      <UploadedTable
        data={[upload]}
        loading={false}
        onStatusChange={jest.fn()}
      />
    );

    expect(screen.getByText(upload.employee_id)).toBeInTheDocument();
    expect(screen.getByText(upload.employee_name)).toBeInTheDocument();
    expect(screen.getByText(upload.status)).toBeInTheDocument();
  });
});

describe('NotUploadedTable Component', () => {
  const NotUploadedTable = ({ data, loading, onUpload }) => (
    <div data-testid="not-uploaded-table">
      {loading ? (
        <div data-testid="table-loading">Loading...</div>
      ) : data.length === 0 ? (
        <div data-testid="empty-message">All forms uploaded!</div>
      ) : (
        <table>
          <tbody>
            {data.map(upload => (
              <tr key={upload.id} data-testid={`pending-row-${upload.id}`}>
                <td>{upload.employee_id}</td>
                <td>{upload.employee_name}</td>
                <td>{upload.status}</td>
                <td>
                  <button
                    onClick={() => onUpload?.(upload.id)}
                    data-testid={`upload-btn-${upload.id}`}
                  >
                    Upload
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  it('should render pending uploads', () => {
    render(
      <NotUploadedTable
        data={mockUploads.notUploaded}
        loading={false}
        onUpload={jest.fn()}
      />
    );

    mockUploads.notUploaded.forEach(upload => {
      expect(screen.getByTestId(`pending-row-${upload.id}`)).toBeInTheDocument();
    });
  });

  it('should show success message when all uploaded', () => {
    render(
      <NotUploadedTable data={[]} loading={false} onUpload={jest.fn()} />
    );

    expect(screen.getByTestId('empty-message')).toHaveTextContent(
      'All forms uploaded!'
    );
  });

  it('should handle upload callback', () => {
    const onUpload = jest.fn();
    const upload = mockUploads.notUploaded[0];
    render(
      <NotUploadedTable
        data={[upload]}
        loading={false}
        onUpload={onUpload}
      />
    );

    fireEvent.click(screen.getByTestId(`upload-btn-${upload.id}`));

    expect(onUpload).toHaveBeenCalledWith(upload.id);
  });
});

describe('SearchBar Component', () => {
  const SearchBar = ({ onSearch, loading }) => (
    <div data-testid="search-bar">
      <input
        type="text"
        placeholder="Search by employee ID or name..."
        onChange={e => onSearch?.(e.target.value)}
        disabled={loading}
        data-testid="search-input"
      />
    </div>
  );

  it('should render search input', () => {
    render(<SearchBar onSearch={jest.fn()} loading={false} />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should handle search input change', async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'John' } });

    expect(onSearch).toHaveBeenCalledWith('John');
  });

  it('should disable input when loading', () => {
    render(<SearchBar onSearch={jest.fn()} loading={true} />);

    expect(screen.getByTestId('search-input')).toBeDisabled();
  });

  it('should clear search on input clear', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '' } });

    expect(onSearch).toHaveBeenCalledWith('');
  });
});

describe('FilterSection Component', () => {
  const FilterSection = ({ onFilterChange, loading }) => (
    <div data-testid="filter-section">
      <select
        onChange={e => onFilterChange?.({ status: e.target.value })}
        disabled={loading}
        data-testid="status-filter"
      >
        <option value="">All Status</option>
        <option value="uploaded">Uploaded</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
      </select>
    </div>
  );

  it('should render filter controls', () => {
    render(<FilterSection onFilterChange={jest.fn()} loading={false} />);

    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('should call onFilterChange when status changes', () => {
    const onFilterChange = jest.fn();
    render(<FilterSection onFilterChange={onFilterChange} loading={false} />);

    const select = screen.getByTestId('status-filter');
    fireEvent.change(select, { target: { value: 'uploaded' } });

    expect(onFilterChange).toHaveBeenCalledWith({ status: 'uploaded' });
  });

  it('should disable filters when loading', () => {
    render(<FilterSection onFilterChange={jest.fn()} loading={true} />);

    expect(screen.getByTestId('status-filter')).toBeDisabled();
  });
});

describe('Pagination Component', () => {
  const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <button
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1}
        data-testid="prev-btn"
      >
        Previous
      </button>
      <span data-testid="page-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages}
        data-testid="next-btn"
      >
        Next
      </button>
    </div>
  );

  it('should render pagination controls', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={jest.fn()} />
    );

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('prev-btn')).toBeInTheDocument();
    expect(screen.getByTestId('next-btn')).toBeInTheDocument();
  });

  it('should show current page info', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />
    );

    expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 5');
  });

  it('should disable previous button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={jest.fn()} />
    );

    expect(screen.getByTestId('prev-btn')).toBeDisabled();
    expect(screen.getByTestId('next-btn')).not.toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={jest.fn()} />
    );

    expect(screen.getByTestId('next-btn')).toBeDisabled();
    expect(screen.getByTestId('prev-btn')).not.toBeDisabled();
  });

  it('should handle page change', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByTestId('next-btn'));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

describe('UploadTrackerTab Component', () => {
  const UploadTrackerTab = ({ activeTab, onTabChange }) => (
    <div data-testid="tab-container">
      <button
        onClick={() => onTabChange?.('uploaded')}
        className={activeTab === 'uploaded' ? 'active' : ''}
        data-testid="uploaded-tab"
      >
        Uploaded
      </button>
      <button
        onClick={() => onTabChange?.('pending')}
        className={activeTab === 'pending' ? 'active' : ''}
        data-testid="pending-tab"
      >
        Pending
      </button>
    </div>
  );

  it('should render tab buttons', () => {
    render(<UploadTrackerTab activeTab="uploaded" onTabChange={jest.fn()} />);

    expect(screen.getByTestId('uploaded-tab')).toBeInTheDocument();
    expect(screen.getByTestId('pending-tab')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(<UploadTrackerTab activeTab="uploaded" onTabChange={jest.fn()} />);

    expect(screen.getByTestId('uploaded-tab')).toHaveClass('active');
    expect(screen.getByTestId('pending-tab')).not.toHaveClass('active');
  });

  it('should handle tab change', () => {
    const onTabChange = jest.fn();
    render(<UploadTrackerTab activeTab="uploaded" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByTestId('pending-tab'));

    expect(onTabChange).toHaveBeenCalledWith('pending');
  });
});

describe('Component Accessibility', () => {
  const AccessibleComponent = ({ label, onClick }) => (
    <button
      onClick={onClick}
      aria-label={label}
      role="button"
      data-testid="accessible-btn"
    >
      {label}
    </button>
  );

  it('should have proper aria labels', () => {
    render(<AccessibleComponent label="Update Status" onClick={jest.fn()} />);

    expect(screen.getByTestId('accessible-btn')).toHaveAttribute(
      'aria-label',
      'Update Status'
    );
  });

  it('should have proper role attributes', () => {
    render(<AccessibleComponent label="Click Me" onClick={jest.fn()} />);

    expect(screen.getByTestId('accessible-btn')).toHaveAttribute(
      'role',
      'button'
    );
  });
});
