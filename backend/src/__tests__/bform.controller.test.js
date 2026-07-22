const bformController = require('../controllers/bformController');
const BFormUpload = require('../models/BFormUpload');
const { AppError } = require('../middleware/errorHandler');

// Mock the BFormUpload model
jest.mock('../models/BFormUpload');

describe('BForm Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      validatedBody: {},
      validatedQuery: {},
      validatedParams: {},
      user: { id: 'user-123' },
      userId: 'user-123',
      userRole: 'manager',
      file: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('listUploads', () => {
    it('should list uploads with pagination', async () => {
      const mockData = {
        data: [
          {
            id: 'upload-1',
            employee_id: 'EMP001',
            employee_name: 'John Doe',
            status: 'verified'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          pages: 5
        }
      };

      BFormUpload.getList.mockResolvedValue(mockData);

      req.validatedQuery = { page: 1, limit: 10 };

      await bformController.listUploads(req, res);

      expect(BFormUpload.getList).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Uploads retrieved successfully',
        data: mockData.data,
        pagination: mockData.pagination
      });
    });

    it('should filter uploads by status', async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };

      BFormUpload.getList.mockResolvedValue(mockData);

      req.validatedQuery = { status: 'pending', page: 1, limit: 10 };

      await bformController.listUploads(req, res);

      expect(BFormUpload.getList).toHaveBeenCalledWith({
        status: 'pending',
        page: 1,
        limit: 10
      });
    });
  });

  describe('getStats', () => {
    it('should return upload statistics', async () => {
      const mockStats = {
        total_uploads: 100,
        uploaded: 85,
        verified: 75,
        pending: 15,
        rejected: 0,
        expired: 0,
        upload_rate: '85.00',
        pending_rate: '15.00'
      };

      BFormUpload.getStats.mockResolvedValue(mockStats);

      req.validatedQuery = { year: 2024 };

      await bformController.getStats(req, res);

      expect(BFormUpload.getStats).toHaveBeenCalledWith({ year: 2024 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Statistics retrieved successfully',
        data: mockStats
      });
    });
  });

  describe('createUpload', () => {
    it('should create a new upload without file', async () => {
      const uploadData = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 2024,
        remarks: 'Test upload'
      };

      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.create.mockResolvedValue({ id: 'upload-123', ...uploadData });

      req.validatedBody = uploadData;

      await bformController.createUpload(req, res);

      expect(BFormUpload.checkDuplicate).toHaveBeenCalledWith('EMP001', 'january', 2024);
      expect(BFormUpload.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Upload created successfully'
        })
      );
    });

    it('should handle duplicate upload error', async () => {
      const uploadData = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 2024
      };

      BFormUpload.checkDuplicate.mockResolvedValue(true);

      req.validatedBody = uploadData;

      try {
        await bformController.createUpload(req, res);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('DUPLICATE_ENTRY');
      }
    });
  });

  describe('updateStatus', () => {
    it('should update upload status', async () => {
      const upload = {
        id: 'upload-123',
        status: 'uploaded',
        employee_id: 'EMP001'
      };

      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.updateStatus.mockResolvedValue({ ...upload, status: 'verified' });

      req.validatedParams = { id: 'upload-123' };
      req.validatedBody = { status: 'verified', remarks: 'Verified successfully' };

      await bformController.updateStatus(req, res);

      expect(BFormUpload.getById).toHaveBeenCalledWith('upload-123');
      expect(BFormUpload.updateStatus).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Upload status updated successfully'
        })
      );
    });

    it('should reject invalid status transition', async () => {
      const upload = {
        id: 'upload-123',
        status: 'verified'
      };

      BFormUpload.getById.mockResolvedValue(upload);

      req.validatedParams = { id: 'upload-123' };
      req.validatedBody = { status: 'uploaded' };

      try {
        await bformController.updateStatus(req, res);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('INVALID_STATUS_TRANSITION');
      }
    });
  });

  describe('batchCreateUploads', () => {
    it('should create batch uploads', async () => {
      const uploads = [
        {
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024
        },
        {
          employee_id: 'EMP002',
          employee_name: 'Jane Smith',
          period: 'january',
          year: 2024
        }
      ];

      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.batchCreate.mockResolvedValue(
        uploads.map((u, i) => ({ id: `upload-${i}`, ...u }))
      );

      req.validatedBody = { uploads };

      await bformController.batchCreateUploads(req, res);

      expect(BFormUpload.batchCreate).toHaveBeenCalledWith(uploads, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Batch uploads created successfully',
          count: 2
        })
      );
    });

    it('should reject duplicate in batch', async () => {
      const uploads = [
        {
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024
        },
        {
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024
        }
      ];

      req.validatedBody = { uploads };

      try {
        await bformController.batchCreateUploads(req, res);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('DUPLICATE_IN_BATCH');
      }
    });
  });

  describe('getHistory', () => {
    it('should return upload history', async () => {
      const upload = { id: 'upload-123', employee_id: 'EMP001' };
      const history = [
        {
          id: 'hist-1',
          action: 'status_updated',
          old_status: 'uploaded',
          new_status: 'verified',
          change_date: '2024-01-16T14:20:00Z'
        }
      ];

      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.getHistory.mockResolvedValue(history);

      req.validatedParams = { id: 'upload-123' };

      await bformController.getHistory(req, res);

      expect(BFormUpload.getHistory).toHaveBeenCalledWith('upload-123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Upload history retrieved successfully',
          data: expect.objectContaining({
            upload: expect.objectContaining({ id: 'upload-123' }),
            history
          })
        })
      );
    });
  });

  describe('getNotUploaded', () => {
    it('should return pending uploads', async () => {
      const mockData = [
        {
          id: 'upload-1',
          status: 'pending',
          employee_id: 'EMP001'
        }
      ];

      BFormUpload.getNotUploaded.mockResolvedValue(mockData);

      req.validatedQuery = { year: 2024 };

      await bformController.getNotUploaded(req, res);

      expect(BFormUpload.getNotUploaded).toHaveBeenCalledWith({ year: 2024 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Not uploaded items retrieved successfully',
        data: mockData,
        count: 1
      });
    });
  });
});
