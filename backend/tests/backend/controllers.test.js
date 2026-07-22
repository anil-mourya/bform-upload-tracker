const bformController = require('../../src/controllers/bformController');
const BFormUpload = require('../../src/models/BFormUpload');
const { AppError } = require('../../src/middleware/errorHandler');
const fs = require('fs').promises;
const {
  createMockUpload,
  createMockHistory,
  mockUploads,
  validCreateUploadPayload,
  validBatchPayload,
  validStatusUpdatePayload,
  mockFile,
  mockStats
} = require('../fixtures');

jest.mock('../../src/models/BFormUpload');
jest.mock('fs');

describe('BForm Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      userId: 'user-123',
      userRole: 'admin',
      validatedBody: {},
      validatedQuery: {},
      validatedParams: {},
      file: null,
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      download: jest.fn().mockImplementation((path, name, cb) => cb(null))
    };
  });

  describe('listUploads', () => {
    it('should return paginated list of uploads', async () => {
      const mockResult = {
        data: mockUploads,
        pagination: { page: 1, limit: 10, total: 5, pages: 1 }
      };

      BFormUpload.getList.mockResolvedValue(mockResult);
      req.validatedQuery = { page: 1, limit: 10 };

      await bformController.listUploads(req, res);

      expect(BFormUpload.getList).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Uploads retrieved successfully',
        data: mockUploads,
        pagination: mockResult.pagination
      });
    });

    it('should handle filters in query parameters', async () => {
      const mockResult = {
        data: [mockUploads[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };

      BFormUpload.getList.mockResolvedValue(mockResult);
      req.validatedQuery = { status: 'uploaded', year: 2024 };

      await bformController.listUploads(req, res);

      expect(BFormUpload.getList).toHaveBeenCalledWith({
        status: 'uploaded',
        year: 2024
      });
    });

    it('should handle empty results', async () => {
      BFormUpload.getList.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });

      await bformController.listUploads(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Uploads retrieved successfully',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });
    });
  });

  describe('getNotUploaded', () => {
    it('should return list of pending uploads', async () => {
      const pendingUploads = [mockUploads[2], mockUploads[3]];
      BFormUpload.getNotUploaded.mockResolvedValue(pendingUploads);

      await bformController.getNotUploaded(req, res);

      expect(BFormUpload.getNotUploaded).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Not uploaded items retrieved successfully',
        data: pendingUploads,
        count: 2
      });
    });

    it('should filter by period and year', async () => {
      const pendingUploads = [mockUploads[2]];
      BFormUpload.getNotUploaded.mockResolvedValue(pendingUploads);
      req.validatedQuery = { period: 'march', year: 2024 };

      await bformController.getNotUploaded(req, res);

      expect(BFormUpload.getNotUploaded).toHaveBeenCalledWith({
        period: 'march',
        year: 2024
      });
    });
  });

  describe('getStats', () => {
    it('should return upload statistics', async () => {
      BFormUpload.getStats.mockResolvedValue(mockStats);

      await bformController.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Statistics retrieved successfully',
        data: mockStats
      });
    });

    it('should filter statistics by year', async () => {
      BFormUpload.getStats.mockResolvedValue(mockStats);
      req.validatedQuery = { year: 2024 };

      await bformController.getStats(req, res);

      expect(BFormUpload.getStats).toHaveBeenCalledWith({ year: 2024 });
    });
  });

  describe('createUpload', () => {
    it('should create new upload without file', async () => {
      const newUpload = createMockUpload(validCreateUploadPayload);
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.create.mockResolvedValue(newUpload);
      req.validatedBody = validCreateUploadPayload;

      await bformController.createUpload(req, res);

      expect(BFormUpload.checkDuplicate).toHaveBeenCalledWith('EMP001', 'january', 2024);
      expect(BFormUpload.create).toHaveBeenCalledWith(
        expect.objectContaining(validCreateUploadPayload)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload created successfully',
        data: newUpload
      });
    });

    it('should create upload with file', async () => {
      const newUpload = createMockUpload({
        ...validCreateUploadPayload,
        file_name: mockFile.originalname,
        file_path: mockFile.path,
        file_size: mockFile.size
      });
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.create.mockResolvedValue(newUpload);
      req.validatedBody = validCreateUploadPayload;
      req.file = mockFile;

      await bformController.createUpload(req, res);

      expect(BFormUpload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: mockFile.originalname,
          file_path: mockFile.path,
          file_size: mockFile.size
        })
      );
    });

    it('should reject duplicate upload', async () => {
      BFormUpload.checkDuplicate.mockResolvedValue(true);
      req.validatedBody = validCreateUploadPayload;

      await expect(bformController.createUpload(req, res)).rejects.toThrow(AppError);
      await expect(bformController.createUpload(req, res))
        .rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_ENTRY' });
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      fs.access.mockResolvedValue(undefined);
      req.validatedParams = { id: upload.id };

      await bformController.downloadFile(req, res);

      expect(BFormUpload.getById).toHaveBeenCalledWith(upload.id);
      expect(res.download).toHaveBeenCalledWith(
        upload.file_path,
        upload.file_name,
        expect.any(Function)
      );
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);
      req.validatedParams = { id: 'invalid-id' };

      await expect(bformController.downloadFile(req, res))
        .rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });

    it('should return 404 for upload without file', async () => {
      const upload = createMockUpload({ file_path: null });
      BFormUpload.getById.mockResolvedValue(upload);
      req.validatedParams = { id: upload.id };

      await expect(bformController.downloadFile(req, res))
        .rejects.toMatchObject({ statusCode: 404, code: 'FILE_NOT_FOUND' });
    });

    it('should return 404 when file not found on server', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      fs.access.mockRejectedValue(new Error('File not found'));
      req.validatedParams = { id: upload.id };

      await expect(bformController.downloadFile(req, res))
        .rejects.toMatchObject({ statusCode: 404, code: 'FILE_NOT_FOUND' });
    });
  });

  describe('getHistory', () => {
    it('should return upload history', async () => {
      const upload = createMockUpload();
      const history = [
        createMockHistory({ action: 'created' }),
        createMockHistory({ action: 'status_updated' })
      ];
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.getHistory.mockResolvedValue(history);
      req.validatedParams = { id: upload.id };

      await bformController.getHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload history retrieved successfully',
        data: {
          upload: expect.objectContaining({
            id: upload.id,
            employee_id: upload.employee_id,
            status: upload.status
          }),
          history
        }
      });
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);
      req.validatedParams = { id: 'invalid-id' };

      await expect(bformController.getHistory(req, res))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('batchCreateUploads', () => {
    it('should create batch of uploads', async () => {
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.batchCreate.mockResolvedValue(
        validBatchPayload.uploads.map(u => createMockUpload(u))
      );
      req.validatedBody = validBatchPayload;

      await bformController.batchCreateUploads(req, res);

      expect(BFormUpload.batchCreate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Batch uploads created successfully',
          count: 2
        })
      );
    });

    it('should reject duplicate entries in batch', async () => {
      const duplicatePayload = {
        uploads: [
          validBatchPayload.uploads[0],
          validBatchPayload.uploads[0] // Duplicate
        ]
      };
      req.validatedBody = duplicatePayload;

      await expect(bformController.batchCreateUploads(req, res))
        .rejects.toMatchObject({ code: 'DUPLICATE_IN_BATCH' });
    });

    it('should reject if upload already exists in database', async () => {
      BFormUpload.checkDuplicate.mockResolvedValueOnce(false);
      BFormUpload.checkDuplicate.mockResolvedValueOnce(true);
      req.validatedBody = validBatchPayload;

      await expect(bformController.batchCreateUploads(req, res))
        .rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });
  });

  describe('updateStatus', () => {
    it('should update upload status', async () => {
      const upload = createMockUpload({ status: 'pending' });
      const updatedUpload = createMockUpload({ status: 'verified' });
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.updateStatus.mockResolvedValue(updatedUpload);
      req.validatedParams = { id: upload.id };
      req.validatedBody = { status: 'verified', remarks: 'Approved' };

      await bformController.updateStatus(req, res);

      expect(BFormUpload.updateStatus).toHaveBeenCalledWith(
        upload.id,
        'verified',
        'Approved',
        'user-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload status updated successfully',
        data: updatedUpload
      });
    });

    it('should reject invalid status transition', async () => {
      const upload = createMockUpload({ status: 'verified' });
      BFormUpload.getById.mockResolvedValue(upload);
      req.validatedParams = { id: upload.id };
      req.validatedBody = { status: 'pending', remarks: 'Test' };

      await expect(bformController.updateStatus(req, res))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'INVALID_STATUS_TRANSITION'
        });
    });

    it('should handle all valid transitions', async () => {
      const transitions = [
        { from: 'pending', to: 'uploaded' },
        { from: 'uploaded', to: 'verified' },
        { from: 'pending', to: 'rejected' },
        { from: 'rejected', to: 'pending' }
      ];

      for (const transition of transitions) {
        const upload = createMockUpload({ status: transition.from });
        const updatedUpload = createMockUpload({ status: transition.to });
        BFormUpload.getById.mockResolvedValue(upload);
        BFormUpload.updateStatus.mockResolvedValue(updatedUpload);
        req.validatedParams = { id: upload.id };
        req.validatedBody = { status: transition.to };

        await bformController.updateStatus(req, res);
        expect(BFormUpload.updateStatus).toHaveBeenCalled();
      }
    });
  });

  describe('uploadWithFile', () => {
    it('should upload file with metadata', async () => {
      const newUpload = createMockUpload({
        ...validCreateUploadPayload,
        file_name: mockFile.originalname
      });
      BFormUpload.checkDuplicate.mockResolvedValue(false);
      BFormUpload.create.mockResolvedValue(newUpload);
      req.validatedBody = validCreateUploadPayload;
      req.file = mockFile;

      await bformController.uploadWithFile(req, res);

      expect(BFormUpload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: mockFile.originalname,
          file_path: mockFile.path,
          file_size: mockFile.size
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject upload without file', async () => {
      req.validatedBody = validCreateUploadPayload;
      req.file = null;

      await expect(bformController.uploadWithFile(req, res))
        .rejects.toMatchObject({ statusCode: 400, code: 'NO_FILE' });
    });

    it('should clean up file on duplicate error', async () => {
      BFormUpload.checkDuplicate.mockResolvedValue(true);
      fs.unlink.mockResolvedValue(undefined);
      req.validatedBody = validCreateUploadPayload;
      req.file = mockFile;

      await expect(bformController.uploadWithFile(req, res))
        .rejects.toThrow();
      expect(fs.unlink).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe('getUploadDetails', () => {
    it('should return upload details', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      req.validatedParams = { id: upload.id };

      await bformController.getUploadDetails(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload details retrieved successfully',
        data: upload
      });
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);
      req.validatedParams = { id: 'invalid-id' };

      await expect(bformController.getUploadDetails(req, res))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('checkExpiredUploads', () => {
    it('should mark expired uploads', async () => {
      const expiredUploads = [
        createMockUpload({ status: 'pending', expiry_date: new Date('2023-01-01') })
      ];
      BFormUpload.getExpiredUploads.mockResolvedValue(expiredUploads);
      BFormUpload.markAsExpired.mockResolvedValue(1);

      await bformController.checkExpiredUploads(req, res);

      expect(BFormUpload.markAsExpired).toHaveBeenCalledWith(['upload-' + expect.any(String)]);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ count: 1 })
        })
      );
    });

    it('should handle no expired uploads', async () => {
      BFormUpload.getExpiredUploads.mockResolvedValue([]);

      await bformController.checkExpiredUploads(req, res);

      expect(BFormUpload.markAsExpired).not.toHaveBeenCalled();
    });
  });

  describe('exportUploads', () => {
    it('should export uploads as CSV', async () => {
      const mockResult = {
        data: mockUploads.slice(0, 2),
        pagination: { page: 1, limit: 10000, total: 2, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      await bformController.exportUploads(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="bform-uploads.csv"'
      );
      expect(res.send).toHaveBeenCalled();
    });

    it('should format CSV data correctly', async () => {
      const mockResult = {
        data: [createMockUpload({ employee_name: 'Test User' })],
        pagination: { page: 1, limit: 10000, total: 1, pages: 1 }
      };
      BFormUpload.getList.mockResolvedValue(mockResult);

      await bformController.exportUploads(req, res);

      const csvCall = res.send.mock.calls[0][0];
      expect(csvCall).toContain('Test User');
      expect(csvCall).toContain('ID,Employee ID,Employee Name');
    });
  });

  describe('deleteUpload', () => {
    it('should delete upload record', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.delete.mockResolvedValue(true);
      fs.unlink.mockResolvedValue(undefined);
      req.validatedParams = { id: upload.id };

      await bformController.deleteUpload(req, res);

      expect(BFormUpload.delete).toHaveBeenCalledWith(upload.id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload deleted successfully',
        data: { id: upload.id }
      });
    });

    it('should clean up associated file when deleting', async () => {
      const upload = createMockUpload({ file_path: '/uploads/test.pdf' });
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.delete.mockResolvedValue(true);
      fs.unlink.mockResolvedValue(undefined);
      req.validatedParams = { id: upload.id };

      await bformController.deleteUpload(req, res);

      expect(fs.unlink).toHaveBeenCalledWith(upload.file_path);
    });

    it('should return 404 for non-existent upload', async () => {
      BFormUpload.getById.mockResolvedValue(null);
      req.validatedParams = { id: 'invalid-id' };

      await expect(bformController.deleteUpload(req, res))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('should handle file deletion errors gracefully', async () => {
      const upload = createMockUpload();
      BFormUpload.getById.mockResolvedValue(upload);
      BFormUpload.delete.mockResolvedValue(true);
      fs.unlink.mockRejectedValue(new Error('File deletion failed'));
      req.validatedParams = { id: upload.id };

      await bformController.deleteUpload(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getUploadsByDateRange', () => {
    it('should retrieve uploads by date range', async () => {
      const uploads = [mockUploads[0]];
      BFormUpload.getByDateRange.mockResolvedValue(uploads);
      req.query = {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      await bformController.getUploadsByDateRange(req, res);

      expect(BFormUpload.getByDateRange).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Uploads retrieved successfully',
        data: uploads,
        count: 1
      });
    });

    it('should filter by status and employee', async () => {
      const uploads = [mockUploads[0]];
      BFormUpload.getByDateRange.mockResolvedValue(uploads);
      req.query = {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'uploaded',
        employee_id: 'EMP001'
      };

      await bformController.getUploadsByDateRange(req, res);

      expect(BFormUpload.getByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        { status: 'uploaded', employee_id: 'EMP001' }
      );
    });

    it('should reject missing date parameters', async () => {
      req.query = { start_date: '2024-01-01' };

      await expect(bformController.getUploadsByDateRange(req, res))
        .rejects.toMatchObject({ statusCode: 400, code: 'MISSING_PARAMS' });
    });

    it('should reject invalid date format', async () => {
      req.query = {
        start_date: 'invalid-date',
        end_date: '2024-12-31'
      };

      await expect(bformController.getUploadsByDateRange(req, res))
        .rejects.toThrow();
    });
  });
});
