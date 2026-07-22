import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

const uploadTrackerService = {
  /**
   * Fetch upload tracker data with filters
   * @param {string} authToken - Authentication token
   * @param {Object} filters - Filter options (period, year, etc.)
   * @returns {Promise<Object>} - Response with uploaded and notUploaded data
   */
  async getUploadTrackerData(authToken, filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.period) params.append('period', filters.period);
      if (filters.year) params.append('year', filters.year);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get('/b-forms/tracker', { params });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch upload tracker data'
      };
    }
  },

  /**
   * Get statistics for B-Forms
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} - Statistics data
   */
  async getUploadStats(authToken) {
    try {
      const response = await apiClient.get('/b-forms/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Upload a B-Form
   * @param {File} file - File to upload
   * @param {Object} metadata - Metadata about the B-Form
   * @returns {Promise<Object>} - Upload response
   */
  async uploadBForm(file, metadata) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bFormNumber', metadata.bFormNumber);
      formData.append('companyId', metadata.companyId);
      formData.append('notes', metadata.notes || '');

      const response = await apiClient.post('/b-forms/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload B-Form'
      };
    }
  },

  /**
   * Assign B-Form to a user
   * @param {string} bFormId - B-Form ID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<Object>} - Assignment response
   */
  async assignBForm(bFormId, userId) {
    try {
      const response = await apiClient.post(`/b-forms/${bFormId}/assign`, {
        assignedTo: userId
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get B-Form details
   * @param {string} bFormId - B-Form ID
   * @returns {Promise<Object>} - B-Form details
   */
  async getBFormDetails(bFormId) {
    try {
      const response = await apiClient.get(`/b-forms/${bFormId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Update B-Form status
   * @param {string} bFormId - B-Form ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Update response
   */
  async updateBFormStatus(bFormId, status) {
    try {
      const response = await apiClient.put(`/b-forms/${bFormId}/status`, {
        status
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Search B-Forms
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Search results
   */
  async searchBForms(query, filters = {}) {
    try {
      const params = new URLSearchParams({ q: query });

      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await apiClient.get('/b-forms/search', { params });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Export B-Forms data
   * @param {string} format - Export format (csv, excel, pdf)
   * @param {Object} filters - Filter options
   * @returns {Promise<Blob>} - Exported file
   */
  async exportBForms(format, filters = {}) {
    try {
      const params = new URLSearchParams({ format });

      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await apiClient.get('/b-forms/export', {
        params,
        responseType: 'blob'
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};

export default uploadTrackerService;
