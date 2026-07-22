import { useState, useEffect, useCallback } from 'react';
import uploadTrackerService from '../services/uploadTrackerService';

function useUploadTracker(authToken, filters = {}) {
  const [data, setData] = useState({
    uploaded: [],
    notUploaded: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    overdue: 0
  });

  const fetchData = useCallback(async () => {
    if (!authToken) {
      setError('Authentication token is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadTrackerService.getUploadTrackerData(authToken, filters);

      if (response.success) {
        setData({
          uploaded: response.data.uploaded || [],
          notUploaded: response.data.notUploaded || []
        });

        // Calculate stats
        const uploaded = response.data.uploaded?.length || 0;
        const notUploaded = response.data.notUploaded?.length || 0;
        const total = uploaded + notUploaded;
        const overdue = response.data.notUploaded?.filter(item => {
          const dueDate = new Date(item.dueDate).setHours(0, 0, 0, 0);
          const today = new Date().setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length || 0;

        setStats({
          total,
          uploaded,
          pending: notUploaded,
          overdue
        });
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching upload tracker data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [authToken, filters]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    stats,
    refetch
  };
}

export default useUploadTracker;
