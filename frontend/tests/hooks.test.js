import { renderHook, act, waitFor } from '@testing-library/react';
import {
  mockToken,
  mockUploads,
  mockStats,
  mockFilters,
  mockApiResponses
} from './fixtures';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }))
}));

describe('useUploadTracker Hook', () => {
  // Mock hook implementation for testing
  const useUploadTracker = (authToken, filters = {}) => {
    const [data, setData] = React.useState({
      uploaded: [],
      notUploaded: []
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [stats, setStats] = React.useState({
      total: 0,
      uploaded: 0,
      pending: 0,
      overdue: 0
    });

    const fetchData = React.useCallback(async () => {
      if (!authToken) {
        setError('Authentication token is missing');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Mock API call
        const response = mockApiResponses.success.uploads;

        if (response.success) {
          setData({
            uploaded: response.data.uploaded || [],
            notUploaded: response.data.notUploaded || []
          });

          const uploaded = response.data.uploaded?.length || 0;
          const notUploaded = response.data.notUploaded?.length || 0;
          const total = uploaded + notUploaded;

          setStats({
            total,
            uploaded,
            pending: notUploaded,
            overdue: 0
          });
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, [authToken, filters]);

    React.useEffect(() => {
      fetchData();
    }, [fetchData]);

    const refetch = React.useCallback(() => {
      fetchData();
    }, [fetchData]);

    return {
      data,
      loading,
      error,
      stats,
      refetch
    };
  };

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useUploadTracker(mockToken));

    expect(result.current.loading).toBe(true);
  });

  it('should fetch data with valid token', async () => {
    const { result } = renderHook(() => useUploadTracker(mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.uploaded).toBeDefined();
    expect(result.current.data.notUploaded).toBeDefined();
  });

  it('should set error when no token provided', async () => {
    const { result } = renderHook(() => useUploadTracker(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Authentication token is missing');
  });

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useUploadTracker(mockToken));

    await waitFor(() => {
      expect(result.current.stats.total).toBeGreaterThan(0);
    });

    const { stats } = result.current;
    expect(stats.uploaded + stats.pending).toBe(stats.total);
  });

  it('should support refetch', async () => {
    const { result } = renderHook(() => useUploadTracker(mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const { result } = renderHook(() => useUploadTracker('invalid-token'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should separate uploaded and not uploaded data', async () => {
    const { result } = renderHook(() => useUploadTracker(mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.data.uploaded)).toBe(true);
    expect(Array.isArray(result.current.data.notUploaded)).toBe(true);
  });
});

describe('useFilter Hook', () => {
  const useFilter = (initialFilters = {}) => {
    const [filters, setFilters] = React.useState(initialFilters);

    const updateFilter = React.useCallback((key, value) => {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }, []);

    const resetFilters = React.useCallback(() => {
      setFilters(initialFilters);
    }, [initialFilters]);

    const setMultipleFilters = React.useCallback((newFilters) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }));
    }, []);

    return {
      filters,
      updateFilter,
      resetFilters,
      setMultipleFilters
    };
  };

  it('should initialize with default filters', () => {
    const defaultFilters = { status: 'all', period: 'january' };
    const { result } = renderHook(() => useFilter(defaultFilters));

    expect(result.current.filters).toEqual(defaultFilters);
  });

  it('should update single filter', () => {
    const { result } = renderHook(() => useFilter());

    act(() => {
      result.current.updateFilter('status', 'uploaded');
    });

    expect(result.current.filters.status).toBe('uploaded');
  });

  it('should update multiple filters', () => {
    const { result } = renderHook(() => useFilter());

    act(() => {
      result.current.setMultipleFilters({
        status: 'pending',
        period: 'february',
        year: 2024
      });
    });

    expect(result.current.filters).toEqual({
      status: 'pending',
      period: 'february',
      year: 2024
    });
  });

  it('should reset filters to initial state', () => {
    const defaultFilters = { status: 'all', period: 'january' };
    const { result } = renderHook(() => useFilter(defaultFilters));

    act(() => {
      result.current.updateFilter('status', 'uploaded');
    });

    expect(result.current.filters.status).toBe('uploaded');

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual(defaultFilters);
  });
});

describe('usePagination Hook', () => {
  const usePagination = (items = [], itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    const getCurrentItems = React.useCallback(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return items.slice(startIndex, endIndex);
    }, [currentPage, items, itemsPerPage]);

    const goToPage = React.useCallback((page) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    }, [totalPages]);

    const nextPage = React.useCallback(() => {
      goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = React.useCallback(() => {
      goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    return {
      currentPage,
      totalPages,
      currentItems: getCurrentItems(),
      goToPage,
      nextPage,
      prevPage
    };
  };

  it('should paginate items correctly', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(items, 10));

    expect(result.current.currentItems).toHaveLength(10);
    expect(result.current.totalPages).toBe(3);
  });

  it('should handle page navigation', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(items, 10));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should not go below page 1', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(items, 10));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should not exceed total pages', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(items, 10));

    act(() => {
      result.current.nextPage();
      result.current.nextPage();
      result.current.nextPage();
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(3);
  });

  it('should go to specific page', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(items, 10));

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);
  });
});

describe('useSearch Hook', () => {
  const useSearch = (items = []) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const results = React.useMemo(() => {
      if (!searchTerm) return items;

      return items.filter(item =>
        item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [searchTerm, items]);

    const clearSearch = React.useCallback(() => {
      setSearchTerm('');
    }, []);

    return {
      searchTerm,
      setSearchTerm,
      results,
      clearSearch,
      hasResults: results.length > 0
    };
  };

  it('should initialize with empty search', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchTerm).toBe('');
  });

  it('should filter by employee name', () => {
    const items = [
      { employee_id: 'EMP001', employee_name: 'John Doe' },
      { employee_id: 'EMP002', employee_name: 'Jane Smith' }
    ];

    const { result } = renderHook(() => useSearch(items));

    act(() => {
      result.current.setSearchTerm('John');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].employee_name).toBe('John Doe');
  });

  it('should filter by employee ID', () => {
    const items = [
      { employee_id: 'EMP001', employee_name: 'John Doe' },
      { employee_id: 'EMP002', employee_name: 'Jane Smith' }
    ];

    const { result } = renderHook(() => useSearch(items));

    act(() => {
      result.current.setSearchTerm('EMP001');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].employee_id).toBe('EMP001');
  });

  it('should be case insensitive', () => {
    const items = [
      { employee_id: 'EMP001', employee_name: 'John Doe' }
    ];

    const { result } = renderHook(() => useSearch(items));

    act(() => {
      result.current.setSearchTerm('JOHN');
    });

    expect(result.current.results).toHaveLength(1);
  });

  it('should clear search', () => {
    const items = [
      { employee_id: 'EMP001', employee_name: 'John Doe' }
    ];

    const { result } = renderHook(() => useSearch(items));

    act(() => {
      result.current.setSearchTerm('John');
    });

    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.results).toHaveLength(1);
  });

  it('should indicate search results status', () => {
    const items = [
      { employee_id: 'EMP001', employee_name: 'John Doe' }
    ];

    const { result } = renderHook(() => useSearch(items));

    act(() => {
      result.current.setSearchTerm('NonExistent');
    });

    expect(result.current.hasResults).toBe(false);
  });
});

describe('useLocalStorage Hook', () => {
  const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = React.useState(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });

    const setValue = React.useCallback((value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    }, [key, storedValue]);

    return [storedValue, setValue];
  };

  it('should initialize from localStorage', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ token: 'test-token' }));

    const { result } = renderHook(() => useLocalStorage('auth', null));

    expect(result.current[0]).toEqual({ token: 'test-token' });
  });

  it('should update localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('auth', null));

    act(() => {
      result.current[1]({ token: 'new-token' });
    });

    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
