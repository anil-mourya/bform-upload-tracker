const request = require('supertest');
const express = require('express');
const bformRoutes = require('../../src/routes/bformRoutes');
const { errorHandler, asyncHandler } = require('../../src/middleware/errorHandler');
const bformController = require('../../src/controllers/bformController');
const BFormUpload = require('../../src/models/BFormUpload');
const { authMiddleware, requireRole } = require('../../src/middleware/auth');
const {
  createMockUpload,
  mockUploads,
  validCreateUploadPayload,
  validBatchPayload,
  validStatusUpdatePayload,
  mockFile,
  mockStats
} = require('../fixtures');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models/BFormUpload');
jest.mock('fs');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        req.user = decoded;
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    next();
  });

  app.use('/api/bform', bformRoutes);
  app.use(errorHandler);

  return app;
};

const generateToken = (role = 'admin') => {
  return jwt.sign(
    { id: 'user-123', email: 'test@example.com', role, full_name: 'Test User' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

describe('BForm API Endpoints', () => {
  let app, token;

  beforeEach(() => {
    app = createTestApp();
    token = generateToken('admin');
    jest.clearAllMocks();
  });

  describe('GET /api/bform/uploads/list', () => {
    it('should list all uploads with pagination', async () => {
      const mockResult = {
        data: mockUploads,
        pagination: { page: 1, limit: 10, total: 5, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.pagination.total).toBe(5);
    });

    it('should filter uploads by status', async () => {
      const mockResult = {
        data: [mockUploads[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'uploaded' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should reject without authentication', async () => {
      const res = await request(app).get('/api/bform/uploads/list');

      expect(res.status).toBe(401);
    });

    it('should validate pagination parameters', async () => {
      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/bform/uploads/not-uploaded', () => {
    it('should return pending uploads', async () => {
      const pendingUploads = [mockUploads[2], mockUploads[3]];
      BFormUpload.getNotUploaded.mockResolvedValue(pendingUploads);

      const res = await request(app)
        .get('/api/bform/uploads/not-uploaded')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should filter by year and period', async () => {
      const pendingUploads = [mockUploads[2]];
      BFormUpload.getNotUploaded.mockResolvedValue(pendingUploads);

      const res = await request(app)
        .get('/api/bform/uploads/not-uploaded')
        .set('Authorization', `Bearer ${token}`)
        .query({ year: 2024, period: 'march' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/bform/uploads/stats', () => {
    it('should return upload statistics', async () => {
      BFormUpload.getStats.mockResolvedValue(mockStats);

      const res = await request(app)
        .get('/api/bform/uploads/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_uploads).toBe(100);
      expect(res.body.data.upload_rate).toBe('80.00');
    });

    it('should filter statistics by year', async () => {
      BFormUpload.getStats.mockResolvedValue(mockStats);

      const res = await request(app)
        .get('/api/bform/uploads/stats')
        .set('Authorization', `Bearer ${token}`)
        .query({ year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/bform/uploads', () => {
    it('should create upload record', async () => {
      const newUpload = createMockUpload(validCreateUploadPayload);
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.create.mockResolvedValue(newUpload);

      const res = await request(app)
        .post('/api/bform/uploads')
        .set('Authorization', `Bearer ${token}`)
        .send(validCreateUploadPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee_id).toBe('EMP001');
    });

    it('should reject duplicate upload', async () => {
      BFormUpload.checkDuplicate.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/bform/uploads')
        .set('Authorization', `Bearer ${token}`)
        .send(validCreateUploadPayload);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_ENTRY');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/bform/uploads')
        .set('Authorization', `Bearer ${token}`)
        .send({ employee_id: 'EMP001' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid period', async () => {
      const res = await request(app)
        .post('/api/bform/uploads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...validCreateUploadPayload,
          period: 'invalid_month'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/bform/uploads/batch', () => {
    it('should create batch uploads', async () => {
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.batchCreate.mockResolvedValue(
        validBatchPayload.uploads.map(u => createMockUpload(u))
      );

      const res = await request(app)
        .post('/api/bform/uploads/batch')
        .set('Authorization', `Bearer ${token}`)
        .send(validBatchPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should require admin or manager role', async () => {
      const userToken = generateToken('user');

      const res = await request(app)
        .post('/api/bform/uploads/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validBatchPayload);

      expect(res.status).toBe(403);
    });

    it('should validate batch array', async () => {
      const res = await request(app)
        .post('/api/bform/uploads/batch')
        .set('Authorization', `Bearer ${token}`)
        .send({ uploads: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bform/uploads/:id', () => {
    it('should get upload details', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);

      const res = await request(app)
        .get(`/api/bform/uploads/${upload.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee_id).toBe(upload.employee_id);
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/bform/uploads/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/bform/uploads/:id/status', () => {
    it('should update upload status', async () => {
      const upload = createMockUpload({ status: 'pending' });
      const updatedUpload = createMockUpload({ status: 'verified' });
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.updateStatus.mockResolvedValue(updatedUpload);

      const res = await request(app)
        .patch(`/api/bform/uploads/${upload.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'verified', remarks: 'Approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('verified');
    });

    it('should reject invalid status', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);

      const res = await request(app)
        .patch(`/api/bform/uploads/${upload.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid transitions', async () => {
      const upload = createMockUpload({ status: 'verified' });
      BFormUpload.getById.mockResolvedValue(upload);

      const res = await request(app)
        .patch(`/api/bform/uploads/${upload.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('GET /api/bform/uploads/:id/history', () => {
    it('should get upload history', async () => {
      const upload = createMockUpload();
      const history = [{ action: 'created', change_date: new Date() }];
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.getHistory.mockResolvedValue(history);

      const res = await request(app)
        .get(`/api/bform/uploads/${upload.id}/history`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.history).toBeDefined();
    });
  });

  describe('GET /api/bform/uploads/:id/download', () => {
    it('should download file', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);

      const res = await request(app)
        .get(`/api/bform/uploads/${upload.id}/download`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should reject when no file exists', async () => {
      const upload = createMockUpload({ file_path: null });
      BFormUpload.getById.mockResolvedValue(upload);

      const res = await request(app)
        .get(`/api/bform/uploads/${upload.id}/download`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/bform/uploads/export', () => {
    it('should export uploads as CSV', async () => {
      const mockResult = {
        data: mockUploads.slice(0, 2),
        pagination: { page: 1, limit: 10000, total: 2, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/export')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.type).toBe('text/csv');
    });

    it('should require admin or manager role', async () => {
      const userToken = generateToken('user');

      const res = await request(app)
        .get('/api/bform/uploads/export')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/bform/uploads/check-expired', () => {
    it('should check and mark expired uploads', async () => {
      const expiredUploads = [createMockUpload()];
      BFormUpload.getExpiredUploads.mockResolvedValue(expiredUploads);
      BFormUpload.markAsExpired.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/bform/uploads/check-expired')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });

    it('should require manager or admin role', async () => {
      const userToken = generateToken('user');

      const res = await request(app)
        .get('/api/bform/uploads/check-expired')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/bform/uploads/date-range', () => {
    it('should retrieve uploads by date range', async () => {
      const uploads = [mockUploads[0]];
      BFormUpload.getByDateRange.mockResolvedValue(uploads);

      const res = await request(app)
        .get('/api/bform/uploads/date-range')
        .set('Authorization', `Bearer ${token}`)
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('should require start_date and end_date', async () => {
      const res = await request(app)
        .get('/api/bform/uploads/date-range')
        .set('Authorization', `Bearer ${token}`)
        .query({ start_date: '2024-01-01' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid date format', async () => {
      const res = await request(app)
        .get('/api/bform/uploads/date-range')
        .set('Authorization', `Bearer ${token}`)
        .query({
          start_date: 'invalid',
          end_date: '2024-12-31'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/bform/uploads/:id', () => {
    it('should delete upload', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/bform/uploads/${upload.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(upload.id);
    });

    it('should require admin role', async () => {
      const upload = createMockUpload();
      const userToken = generateToken('manager');

      const res = await request(app)
        .delete(`/api/bform/uploads/${upload.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/bform/uploads/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/bform/uploads/list');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_MISSING');
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should accept bearer token format', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Pagination & Filtering', () => {
    it('should handle multiple filters together', async () => {
      const mockResult = {
        data: [mockUploads[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          status: 'uploaded',
          year: 2024,
          period: 'january',
          employee_id: 'EMP001'
        });

      expect(res.status).toBe(200);
    });

    it('should support custom page size', async () => {
      const mockResult = {
        data: mockUploads.slice(0, 5),
        pagination: { page: 1, limit: 5, total: 5, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should support sorting', async () => {
      const mockResult = {
        data: mockUploads,
        pagination: { page: 1, limit: 10, total: 5, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/bform/uploads/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ sort_by: 'upload_date', sort_order: 'asc' });

      expect(res.status).toBe(200);
    });
  });
});
