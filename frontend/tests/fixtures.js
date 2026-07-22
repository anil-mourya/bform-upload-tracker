// Frontend test fixtures and mock data

export const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIn0.test';

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin'
};

export const createMockUpload = (overrides = {}) => ({
  id: `upload-${Math.random().toString(36).substr(2, 9)}`,
  employee_id: 'EMP001',
  employee_name: 'John Doe',
  period: 'january',
  year: 2024,
  status: 'uploaded',
  file_name: 'form.pdf',
  upload_date: new Date('2024-01-01').toISOString(),
  expiry_date: new Date('2025-01-01').toISOString(),
  remarks: 'Test upload',
  ...overrides
});

export const mockUploads = {
  uploaded: [
    createMockUpload({ status: 'uploaded', employee_id: 'EMP001', employee_name: 'John Doe' }),
    createMockUpload({ status: 'verified', employee_id: 'EMP002', employee_name: 'Jane Smith' })
  ],
  notUploaded: [
    createMockUpload({ status: 'pending', employee_id: 'EMP003', employee_name: 'Bob Johnson' }),
    createMockUpload({ status: 'pending', employee_id: 'EMP004', employee_name: 'Alice Williams' })
  ]
};

export const mockStats = {
  total: 100,
  uploaded: 70,
  pending: 25,
  overdue: 5
};

export const mockFilters = {
  status: 'uploaded',
  period: 'january',
  year: 2024,
  searchTerm: 'John'
};

export const mockPaginationData = {
  data: [
    createMockUpload({ employee_id: 'EMP001' }),
    createMockUpload({ employee_id: 'EMP002' }),
    createMockUpload({ employee_id: 'EMP003' })
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 3,
    pages: 1
  }
};

export const mockApiResponses = {
  success: {
    uploads: {
      success: true,
      data: mockUploads,
      message: 'Uploads retrieved successfully'
    },
    stats: {
      success: true,
      data: mockStats,
      message: 'Statistics retrieved successfully'
    },
    notUploaded: {
      success: true,
      data: mockUploads.notUploaded,
      count: mockUploads.notUploaded.length,
      message: 'Not uploaded items retrieved'
    }
  },
  error: {
    invalid: {
      success: false,
      error: 'Invalid request',
      code: 'INVALID_REQUEST'
    },
    unauthorized: {
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    },
    serverError: {
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    }
  }
};

export const mockFile = {
  name: 'test-form.pdf',
  size: 1024,
  type: 'application/pdf'
};

export const mockValidationErrors = {
  required_fields: [
    { field: 'employee_id', message: 'Employee ID is required' },
    { field: 'employee_name', message: 'Employee name is required' }
  ],
  invalid_period: [
    { field: 'period', message: 'Invalid period selected' }
  ],
  invalid_year: [
    { field: 'year', message: 'Year must be between 2000 and 2100' }
  ]
};

export const mockHistoryData = [
  {
    id: 'hist-1',
    action: 'created',
    old_status: null,
    new_status: 'uploaded',
    changed_by_name: 'Admin User',
    change_date: new Date('2024-01-01').toISOString(),
    remarks: 'Upload created'
  },
  {
    id: 'hist-2',
    action: 'status_updated',
    old_status: 'uploaded',
    new_status: 'verified',
    changed_by_name: 'Manager User',
    change_date: new Date('2024-01-05').toISOString(),
    remarks: 'Verification completed'
  }
];

export const mockSearchResults = [
  createMockUpload({ employee_name: 'John Doe', employee_id: 'EMP001' }),
  createMockUpload({ employee_name: 'John Smith', employee_id: 'EMP005' })
];

export const mockFilteredResults = {
  byStatus: {
    uploaded: [
      createMockUpload({ status: 'uploaded' }),
      createMockUpload({ status: 'uploaded' })
    ],
    pending: [createMockUpload({ status: 'pending' })],
    verified: [createMockUpload({ status: 'verified' })]
  },
  byPeriod: {
    january: [createMockUpload({ period: 'january' })],
    february: [createMockUpload({ period: 'february' })]
  },
  byYear: {
    2024: [createMockUpload({ year: 2024 })],
    2025: [createMockUpload({ year: 2025 })]
  }
};

export const mockDateRangeData = {
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  uploads: [
    createMockUpload({ upload_date: new Date('2024-01-15').toISOString() }),
    createMockUpload({ upload_date: new Date('2024-06-15').toISOString() }),
    createMockUpload({ upload_date: new Date('2024-12-15').toISOString() })
  ]
};

export const mockExpiredData = [
  createMockUpload({
    status: 'expired',
    expiry_date: new Date('2023-01-01').toISOString()
  }),
  createMockUpload({
    status: 'expired',
    expiry_date: new Date('2023-06-01').toISOString()
  })
];
