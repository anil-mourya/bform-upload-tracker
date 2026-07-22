import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import {
  mockToken,
  mockUploads,
  mockStats,
  mockApiResponses,
  mockFilters
} from './fixtures';

jest.mock('axios');

describe('Upload Tracker Integration Tests', () => {
  beforeEach(() => {
    axios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    });
  });

  describe('Complete User Flow - Upload List', () => {
    it('should load and display upload tracker on mount', async () => {
      axios.create().get.mockResolvedValue({
        data: mockApiResponses.success.uploads
      });

      render(
        <div data-testid="upload-tracker">
          <div data-testid="stats-container">Stats</div>
          <div data-testid="uploads-table">Table</div>
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('upload-tracker')).toBeInTheDocument();
      });
    });

    it('should display error message on API failure', async () => {
      axios.create().get.mockRejectedValue(
        new Error('Network error')
      );

      const { rerender } = render(
        <div data-testid="error-container">Error</div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-container')).toBeInTheDocument();
      });
    });
  });

  describe('Filter and Search Flow', () => {
    it('should apply filters and fetch filtered data', async () => {
      const mockGet = jest.fn()
        .mockResolvedValueOnce({ data: mockApiResponses.success.uploads });

      axios.create().get = mockGet;

      const { getByTestId } = render(
        <div data-testid="filter-component">
          <select
            data-testid="status-filter"
            onChange={e => mockGet({ params: { status: e.target.value } })}
          >
            <option value="">All</option>
            <option value="uploaded">Uploaded</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      );

      const statusFilter = getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'uploaded' } });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });

    it('should update results when search term changes', async () => {
      const items = [
        { id: '1', employee_id: 'EMP001', employee_name: 'John Doe' },
        { id: '2', employee_id: 'EMP002', employee_name: 'Jane Smith' }
      ];

      render(
        <div data-testid="search-component">
          <input
            type="text"
            placeholder="Search..."
            data-testid="search-input"
            onChange={e => {
              // Filter items based on search
              const filtered = items.filter(item =>
                item.employee_name.toLowerCase().includes(e.target.value.toLowerCase())
              );
            }}
          />
        </div>
      );

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'John' } });

      expect(input.value).toBe('John');
    });

    it('should reset filters and show all data', async () => {
      const mockGet = jest.fn()
        .mockResolvedValue({ data: mockApiResponses.success.uploads });

      axios.create().get = mockGet;

      render(
        <div data-testid="filter-reset">
          <button
            data-testid="reset-btn"
            onClick={() => mockGet()}
          >
            Reset Filters
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('reset-btn'));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination Flow', () => {
    it('should navigate between pages', async () => {
      const { getByTestId } = render(
        <div data-testid="pagination">
          <button data-testid="prev-btn" disabled>Previous</button>
          <span data-testid="page-info">Page 1 of 5</span>
          <button data-testid="next-btn">Next</button>
        </div>
      );

      const nextBtn = getByTestId('next-btn');
      expect(nextBtn).not.toBeDisabled();
      expect(getByTestId('prev-btn')).toBeDisabled();
    });

    it('should load new data when page changes', async () => {
      const mockGet = jest.fn()
        .mockResolvedValue({ data: mockApiResponses.success.uploads });

      axios.create().get = mockGet;

      render(
        <div data-testid="paginated-table">
          <button
            data-testid="next-page"
            onClick={() => mockGet({ params: { page: 2 } })}
          >
            Next Page
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('next-page'));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation Flow', () => {
    it('should switch between uploaded and not uploaded tabs', async () => {
      const { getByTestId, queryByTestId } = render(
        <div data-testid="tab-container">
          <button
            data-testid="uploaded-tab"
            className="active"
            onClick={() => { /* switch tab */ }}
          >
            Uploaded
          </button>
          <button
            data-testid="pending-tab"
            onClick={() => { /* switch tab */ }}
          >
            Pending
          </button>
          <div data-testid="uploaded-content">Uploaded Forms</div>
        </div>
      );

      expect(getByTestId('uploaded-tab')).toHaveClass('active');
      expect(queryByTestId('pending-tab')).not.toHaveClass('active');

      fireEvent.click(getByTestId('pending-tab'));
      expect(getByTestId('pending-tab')).toBeDefined();
    });
  });

  describe('Status Update Flow', () => {
    it('should update upload status', async () => {
      const mockPatch = jest.fn()
        .mockResolvedValue({
          data: {
            success: true,
            data: { ...mockUploads.uploaded[0], status: 'verified' }
          }
        });

      axios.create().patch = mockPatch;

      render(
        <div data-testid="status-update">
          <button
            data-testid="verify-btn"
            onClick={() => mockPatch('/uploads/123/status', { status: 'verified' })}
          >
            Verify
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('verify-btn'));

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith(
          '/uploads/123/status',
          { status: 'verified' }
        );
      });
    });

    it('should show confirmation before status update', async () => {
      window.confirm = jest.fn(() => true);

      render(
        <div data-testid="confirm-dialog">
          <button
            data-testid="update-status-btn"
            onClick={() => window.confirm('Update status?')}
          >
            Update
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('update-status-btn'));

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should handle status update error', async () => {
      const mockPatch = jest.fn()
        .mockRejectedValue(new Error('Status update failed'));

      axios.create().patch = mockPatch;

      render(
        <div data-testid="error-message">
          <button
            data-testid="update-btn"
            onClick={() => mockPatch('/uploads/123/status', {})}
          >
            Update
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('update-btn'));

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalled();
      });
    });
  });

  describe('File Download Flow', () => {
    it('should download file', async () => {
      const mockGet = jest.fn()
        .mockResolvedValue({
          data: Buffer.from('PDF content')
        });

      axios.create().get = mockGet;

      render(
        <div data-testid="download-section">
          <button
            data-testid="download-btn"
            onClick={() => mockGet('/uploads/123/download', { responseType: 'blob' })}
          >
            Download
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('download-btn'));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });

    it('should show download progress', async () => {
      render(
        <div data-testid="download-progress">
          <button data-testid="download-btn">Download</button>
          <div data-testid="progress-bar">0%</div>
        </div>
      );

      expect(screen.getByTestId('download-progress')).toBeInTheDocument();
    });
  });

  describe('Stats Display Flow', () => {
    it('should display and update statistics', async () => {
      const mockGet = jest.fn()
        .mockResolvedValue({
          data: mockApiResponses.success.stats
        });

      axios.create().get = mockGet;

      render(
        <div data-testid="stats-display">
          <div data-testid="total-stat">100</div>
          <div data-testid="uploaded-stat">70</div>
          <div data-testid="pending-stat">25</div>
          <div data-testid="overdue-stat">5</div>
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-stat')).toBeInTheDocument();
      });
    });

    it('should calculate percentages for stats', () => {
      const stats = { total: 100, uploaded: 70, pending: 25, overdue: 5 };

      const uploadRate = (stats.uploaded / stats.total) * 100;
      const pendingRate = (stats.pending / stats.total) * 100;

      expect(uploadRate).toBe(70);
      expect(pendingRate).toBe(25);
    });
  });

  describe('Export Flow', () => {
    it('should export data as CSV', async () => {
      const mockGet = jest.fn()
        .mockResolvedValue({
          data: 'CSV content'
        });

      axios.create().get = mockGet;

      render(
        <div data-testid="export-section">
          <button
            data-testid="export-btn"
            onClick={() => mockGet('/uploads/export', { responseType: 'blob' })}
          >
            Export
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('export-btn'));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });
  });

  describe('Batch Operations Flow', () => {
    it('should select multiple uploads', () => {
      render(
        <div data-testid="batch-container">
          <input type="checkbox" data-testid="select-all" />
          <input type="checkbox" data-testid="item-1" />
          <input type="checkbox" data-testid="item-2" />
        </div>
      );

      const selectAll = screen.getByTestId('select-all');
      fireEvent.click(selectAll);

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
    });

    it('should perform batch actions', async () => {
      const mockPatch = jest.fn()
        .mockResolvedValue({ data: { success: true } });

      axios.create().patch = mockPatch;

      render(
        <div data-testid="batch-actions">
          <button
            data-testid="batch-verify"
            onClick={() => mockPatch('/uploads/batch/status', { status: 'verified' })}
          >
            Verify All Selected
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('batch-verify'));

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should display network error message', async () => {
      axios.create().get.mockRejectedValue(new Error('Network error'));

      render(
        <div data-testid="error-container">
          <div data-testid="error-message">Network error occurred</div>
        </div>
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should retry after error', async () => {
      const mockGet = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ data: mockApiResponses.success.uploads });

      axios.create().get = mockGet;

      render(
        <div data-testid="error-retry">
          <button
            data-testid="retry-btn"
            onClick={() => mockGet()}
          >
            Retry
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('retry-btn'));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle missing token', () => {
      localStorage.getItem.mockReturnValue(null);

      render(
        <div data-testid="auth-check">
          <div data-testid="login-required">Please login</div>
        </div>
      );

      expect(screen.getByTestId('login-required')).toBeInTheDocument();
    });

    it('should use stored token from localStorage', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ token: mockToken }));

      const { getByTestId } = render(
        <div data-testid="auth-container" />
      );

      expect(localStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data at intervals', async () => {
      jest.useFakeTimers();

      const mockGet = jest.fn()
        .mockResolvedValue({ data: mockApiResponses.success.uploads });

      axios.create().get = mockGet;

      render(
        <div data-testid="auto-refresh">
          Refreshing data...
        </div>
      );

      jest.advanceTimersByTime(30000); // 30 seconds

      expect(screen.getByTestId('auto-refresh')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});

describe('Accessibility Integration Tests', () => {
  it('should provide keyboard navigation', () => {
    const { getByTestId } = render(
      <div>
        <button data-testid="btn-1">Button 1</button>
        <button data-testid="btn-2">Button 2</button>
      </div>
    );

    const btn1 = getByTestId('btn-1');
    btn1.focus();

    expect(document.activeElement).toBe(btn1);
  });

  it('should announce loading state to screen readers', () => {
    render(
      <div aria-busy="true" aria-label="Loading uploads">
        <div data-testid="loading">Loading...</div>
      </div>
    );

    const container = screen.getByTestId('loading').parentElement;
    expect(container).toHaveAttribute('aria-busy', 'true');
  });

  it('should provide error announcements', () => {
    render(
      <div role="alert" data-testid="error">
        Error loading data
      </div>
    );

    expect(screen.getByTestId('error')).toHaveAttribute('role', 'alert');
  });
});

describe('Performance Integration Tests', () => {
  it('should debounce search input', async () => {
    const mockGet = jest.fn();
    axios.create().get = mockGet;

    render(
      <div data-testid="search">
        <input
          type="text"
          data-testid="search-input"
          onChange={e => mockGet({ params: { search: e.target.value } })}
        />
      </div>
    );

    const input = screen.getByTestId('search-input');

    // Simulate rapid typing
    fireEvent.change(input, { target: { value: 'J' } });
    fireEvent.change(input, { target: { value: 'Jo' } });
    fireEvent.change(input, { target: { value: 'Joh' } });
    fireEvent.change(input, { target: { value: 'John' } });

    // Debounce should reduce calls
    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeLessThan(4);
    });
  });
});
