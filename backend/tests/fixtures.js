// Test fixtures and mock data

const createMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  password_hash: 'hashedpassword',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});

const createMockUpload = (overrides = {}) => ({
  id: 'upload-' + Math.random().toString(36).substr(2, 9),
  employee_id: 'EMP001',
  employee_name: 'John Doe',
  period: 'january',
  year: 2024,
  status: 'pending',
  file_name: 'form.pdf',
  file_path: '/uploads/form.pdf',
  file_size: 1024,
  uploaded_by_id: 'user-123',
  verified_by_id: null,
  remarks: 'Test upload',
  upload_date: new Date('2024-01-01'),
  verification_date: null,
  expiry_date: new Date('2025-01-01'),
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides
});

const createMockHistory = (overrides = {}) => ({
  id: 'history-' + Math.random().toString(36).substr(2, 9),
  upload_id: 'upload-123',
  action: 'status_updated',
  old_status: 'pending',
  new_status: 'uploaded',
  changed_by_id: 'user-123',
  changed_by_name: 'Test User',
  email: 'test@example.com',
  remarks: 'Status updated',
  change_date: new Date(),
  ...overrides
});

const mockUploads = [
  createMockUpload({ employee_id: 'EMP001', employee_name: 'John Doe', period: 'january', status: 'uploaded' }),
  createMockUpload({ employee_id: 'EMP002', employee_name: 'Jane Smith', period: 'february', status: 'verified' }),
  createMockUpload({ employee_id: 'EMP003', employee_name: 'Bob Johnson', period: 'march', status: 'pending' }),
  createMockUpload({ employee_id: 'EMP004', employee_name: 'Alice Williams', period: 'april', status: 'rejected' }),
  createMockUpload({ employee_id: 'EMP005', employee_name: 'Charlie Brown', period: 'may', status: 'expired' })
];

const validCreateUploadPayload = {
  employee_id: 'EMP001',
  employee_name: 'John Doe',
  period: 'january',
  year: 2024,
  remarks: 'Annual B-Form'
};

const validBatchPayload = {
  uploads: [
    {
      employee_id: 'EMP001',
      employee_name: 'John Doe',
      period: 'february',
      year: 2024
    },
    {
      employee_id: 'EMP002',
      employee_name: 'Jane Smith',
      period: 'march',
      year: 2024
    }
  ]
};

const validStatusUpdatePayload = {
  status: 'verified',
  remarks: 'Verification completed'
};

const invalidStatusUpdatePayload = {
  status: 'invalid_status',
  remarks: 'Test'
};

const mockFile = {
  fieldname: 'file',
  originalname: 'test-form.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
  destination: './uploads',
  filename: 'test-form-123.pdf',
  path: './uploads/test-form-123.pdf'
};

const mockStats = {
  total_uploads: 100,
  uploaded: 50,
  verified: 30,
  pending: 15,
  rejected: 4,
  expired: 1,
  total_file_size: 512000,
  unique_employees: 45,
  upload_rate: '80.00',
  pending_rate: '15.00'
};

const queryParamVariations = {
  valid: [
    { page: 1, limit: 10 },
    { status: 'pending', year: 2024 },
    { period: 'january', employee_id: 'EMP001' },
    { sort_by: 'upload_date', sort_order: 'asc' }
  ],
  invalid: [
    { page: 0 },
    { limit: 101 },
    { status: 'invalid' },
    { year: 1999 },
    { period: 'invalid_month' }
  ]
};

module.exports = {
  createMockUser,
  createMockUpload,
  createMockHistory,
  mockUploads,
  validCreateUploadPayload,
  validBatchPayload,
  validStatusUpdatePayload,
  invalidStatusUpdatePayload,
  mockFile,
  mockStats,
  queryParamVariations
};
