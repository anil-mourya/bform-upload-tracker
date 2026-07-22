// Test setup and global configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.UPLOAD_DIR = './test-uploads';
process.env.MAX_FILE_SIZE = '52428800';

// Mock database pool
jest.mock('../config/database', () => ({
  pool: {
    getConnection: jest.fn(),
    end: jest.fn()
  }
}));

// Global test utilities
global.testUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'admin',
  full_name: 'Test User'
};

global.testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiZnVsbF9uYW1lIjoiVGVzdCBVc2VyIn0.test';

global.testUpload = {
  id: 'upload-123',
  employee_id: 'EMP001',
  employee_name: 'John Doe',
  period: 'january',
  year: 2024,
  status: 'pending',
  file_name: 'form.pdf',
  file_path: '/uploads/form.pdf',
  file_size: 1024,
  uploaded_by_id: 'user-123',
  remarks: 'Test upload',
  upload_date: new Date('2024-01-01'),
  expiry_date: new Date('2025-01-01'),
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01')
};

// Setup afterEach to clear all mocks
afterEach(() => {
  jest.clearAllMocks();
});
