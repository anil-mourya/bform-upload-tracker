const BFormUpload = require('../../src/models/BFormUpload');
const { pool } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const {
  createMockUpload,
  createMockHistory,
  mockUploads,
  mockStats
} = require('../fixtures');

jest.mock('../../config/database');
jest.mock('uuid');

describe('BFormUpload Model', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);
    uuidv4.mockReturnValue('test-uuid');
  });

  describe('create', () => {
    it('should create a new upload record', async () => {
      const uploadData = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 2024,
        uploaded_by_id: 'user-123'
      };

      mockConnection.execute.mockResolvedValueOnce([[{ insertId: 1, affectedRows: 1 }]])
        .mockResolvedValueOnce([[]]); // for history

      const result = await BFormUpload.create(uploadData);

      expect(result).toEqual(expect.objectContaining(uploadData));
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should calculate expiry date as 1 year from now', async () => {
      const uploadData = createMockUpload();
      mockConnection.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

      await BFormUpload.create(uploadData);

      const callArgs = mockConnection.execute.mock.calls[0][1];
      const expiryDate = callArgs[11]; // expiry_date is at index 11
      expect(expiryDate).toBeDefined();
    });

    it('should set status to uploaded by default', async () => {
      const uploadData = { employee_id: 'EMP001', employee_name: 'John' };
      mockConnection.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

      await BFormUpload.create(uploadData);

      const callArgs = mockConnection.execute.mock.calls[0][1];
      expect(callArgs[8]).toBe('uploaded'); // status field
    });

    it('should handle optional file fields', async () => {
      const uploadData = { employee_id: 'EMP001', employee_name: 'John' };
      mockConnection.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

      await BFormUpload.create(uploadData);

      const callArgs = mockConnection.execute.mock.calls[0][1];
      expect(callArgs[5]).toBeNull(); // file_name
      expect(callArgs[6]).toBeNull(); // file_path
      expect(callArgs[7]).toBeNull(); // file_size
    });

    it('should add history entry on creation', async () => {
      const uploadData = createMockUpload();
      mockConnection.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

      await BFormUpload.create(uploadData);

      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      const historyCall = mockConnection.execute.mock.calls[1];
      expect(historyCall[0]).toContain('INSERT INTO upload_history');
    });

    it('should release connection even on error', async () => {
      mockConnection.execute.mockRejectedValue(new Error('DB Error'));

      await expect(BFormUpload.create({})).rejects.toThrow();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should retrieve upload by ID', async () => {
      const upload = createMockUpload();
      mockConnection.execute.mockResolvedValue([[upload]]);

      const result = await BFormUpload.getById('upload-123');

      expect(result).toEqual(upload);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM b_form_uploads WHERE id = ?'),
        ['upload-123']
      );
    });

    it('should return null for non-existent upload', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.getById('invalid-id');

      expect(result).toBeNull();
    });

    it('should release connection', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      await BFormUpload.getById('upload-123');

      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getList', () => {
    it('should return uploads with pagination', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([mockUploads])
        .mockResolvedValueOnce([[{ total: 5 }]]);

      const result = await BFormUpload.getList({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(5);
    });

    it('should filter by status', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[mockUploads[0]]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await BFormUpload.getList({ status: 'uploaded' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by multiple criteria', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[mockUploads[0]]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await BFormUpload.getList({
        status: 'uploaded',
        year: 2024,
        period: 'january',
        employee_id: 'EMP001'
      });

      expect(result.data).toHaveLength(1);
    });

    it('should support sorting', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([mockUploads])
        .mockResolvedValueOnce([[{ total: 5 }]]);

      const result = await BFormUpload.getList({
        sort_by: 'upload_date',
        sort_order: 'asc'
      });

      expect(result.data).toBeDefined();
    });

    it('should calculate correct pagination pages', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([mockUploads.slice(0, 3)])
        .mockResolvedValueOnce([[{ total: 25 }]]);

      const result = await BFormUpload.getList({ limit: 10 });

      expect(result.pagination.pages).toBe(3); // Math.ceil(25 / 10)
    });

    it('should handle search by employee name', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[mockUploads[0]]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await BFormUpload.getList({ employee_name: 'John' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getNotUploaded', () => {
    it('should return pending uploads', async () => {
      const pendingUploads = [mockUploads[2], mockUploads[3]];
      mockConnection.execute.mockResolvedValue([pendingUploads]);

      const result = await BFormUpload.getNotUploaded();

      expect(result).toHaveLength(2);
    });

    it('should filter by period', async () => {
      mockConnection.execute.mockResolvedValue([[mockUploads[2]]]);

      const result = await BFormUpload.getNotUploaded({ period: 'march' });

      expect(result).toHaveLength(1);
    });

    it('should filter by year', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.getNotUploaded({ year: 2025 });

      expect(result).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      mockConnection.execute.mockResolvedValue([[mockStats]]);

      const result = await BFormUpload.getStats();

      expect(result.total_uploads).toBe(100);
      expect(result.uploaded).toBe(50);
      expect(result.verified).toBe(30);
      expect(result.upload_rate).toBeDefined();
    });

    it('should calculate upload rate', async () => {
      const stats = { ...mockStats };
      mockConnection.execute.mockResolvedValue([[stats]]);

      const result = await BFormUpload.getStats();

      expect(result.upload_rate).toBe('80.00');
    });

    it('should filter by year', async () => {
      mockConnection.execute.mockResolvedValue([[mockStats]]);

      const result = await BFormUpload.getStats({ year: 2024 });

      expect(result).toBeDefined();
    });

    it('should filter by period', async () => {
      mockConnection.execute.mockResolvedValue([[mockStats]]);

      const result = await BFormUpload.getStats({ period: 'january' });

      expect(result).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update upload status', async () => {
      const upload = createMockUpload({ status: 'pending' });
      mockConnection.execute
        .mockResolvedValueOnce([[upload]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]); // getById, update, addHistory

      const result = await BFormUpload.updateStatus(upload.id, 'verified', 'Approved', 'user-123');

      expect(result.status).toBe('verified');
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE b_form_uploads'),
        expect.arrayContaining(['verified'])
      );
    });

    it('should set verification date when verifying', async () => {
      const upload = createMockUpload();
      mockConnection.execute
        .mockResolvedValueOnce([[upload]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await BFormUpload.updateStatus(upload.id, 'verified', null, 'user-123');

      const updateCall = mockConnection.execute.mock.calls[1];
      expect(updateCall[0]).toContain('verification_date');
    });

    it('should add history entry', async () => {
      const upload = createMockUpload();
      mockConnection.execute
        .mockResolvedValueOnce([[upload]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await BFormUpload.updateStatus(upload.id, 'verified', 'OK', 'user-123');

      const historyCall = mockConnection.execute.mock.calls[2];
      expect(historyCall[0]).toContain('upload_history');
    });
  });

  describe('batchCreate', () => {
    it('should create multiple uploads in transaction', async () => {
      const uploads = [
        { employee_id: 'EMP001', employee_name: 'John', period: 'january', year: 2024 },
        { employee_id: 'EMP002', employee_name: 'Jane', period: 'february', year: 2024 }
      ];

      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.batchCreate(uploads, 'user-123');

      expect(result).toHaveLength(2);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const uploads = [{ employee_id: 'EMP001', employee_name: 'John' }];
      mockConnection.execute.mockRejectedValue(new Error('DB Error'));

      await expect(BFormUpload.batchCreate(uploads, 'user-123'))
        .rejects.toThrow();

      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('should use pending status for batch uploads', async () => {
      const uploads = [{ employee_id: 'EMP001', employee_name: 'John' }];
      mockConnection.execute.mockResolvedValue([[]]);

      await BFormUpload.batchCreate(uploads, 'user-123');

      const insertCall = mockConnection.execute.mock.calls[0];
      expect(insertCall[1]).toContain('pending');
    });
  });

  describe('checkDuplicate', () => {
    it('should return true for duplicate entry', async () => {
      mockConnection.execute.mockResolvedValue([[{ count: 1 }]]);

      const result = await BFormUpload.checkDuplicate('EMP001', 'january', 2024);

      expect(result).toBe(true);
    });

    it('should return false for unique entry', async () => {
      mockConnection.execute.mockResolvedValue([[{ count: 0 }]]);

      const result = await BFormUpload.checkDuplicate('EMP001', 'february', 2024);

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete upload record', async () => {
      mockConnection.execute.mockResolvedValue([[{ affectedRows: 1 }]]);

      const result = await BFormUpload.delete('upload-123');

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM b_form_uploads'),
        ['upload-123']
      );
    });

    it('should return false if no rows affected', async () => {
      mockConnection.execute.mockResolvedValue([[{ affectedRows: 0 }]]);

      const result = await BFormUpload.delete('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('getExpiredUploads', () => {
    it('should return expired uploads', async () => {
      const expiredUploads = [mockUploads[4]];
      mockConnection.execute.mockResolvedValue([expiredUploads]);

      const result = await BFormUpload.getExpiredUploads();

      expect(result).toHaveLength(1);
    });

    it('should exclude already expired entries', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.getExpiredUploads();

      expect(result).toHaveLength(0);
    });
  });

  describe('markAsExpired', () => {
    it('should update status to expired', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.markAsExpired(['id1', 'id2']);

      expect(result).toBe(2);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('expired'),
        ['id1', 'id2']
      );
    });

    it('should handle empty array', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.markAsExpired([]);

      expect(result).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should return upload history with user details', async () => {
      const history = [
        createMockHistory({ action: 'created' }),
        createMockHistory({ action: 'status_updated' })
      ];
      mockConnection.execute.mockResolvedValue([history]);

      const result = await BFormUpload.getHistory('upload-123');

      expect(result).toHaveLength(2);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('upload_history'),
        ['upload-123']
      );
    });

    it('should include changed_by_name', async () => {
      const history = [createMockHistory({ changed_by_name: 'Admin User' })];
      mockConnection.execute.mockResolvedValue([history]);

      const result = await BFormUpload.getHistory('upload-123');

      expect(result[0].changed_by_name).toBe('Admin User');
    });
  });

  describe('addHistory', () => {
    it('should add history entry', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await BFormUpload.addHistory(
        'upload-123',
        'status_updated',
        'pending',
        'verified',
        'user-123',
        'Approved'
      );

      expect(result).toBe('test-uuid');
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO upload_history'),
        expect.any(Array)
      );
    });
  });

  describe('getByDateRange', () => {
    it('should retrieve uploads by date range', async () => {
      const uploads = [mockUploads[0]];
      mockConnection.execute.mockResolvedValue([uploads]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await BFormUpload.getByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('upload_date'),
        [startDate, endDate]
      );
    });

    it('should filter by status', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await BFormUpload.getByDateRange(startDate, endDate, { status: 'verified' });

      const callArgs = mockConnection.execute.mock.calls[0];
      expect(callArgs[0]).toContain('status');
    });

    it('should filter by employee_id', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await BFormUpload.getByDateRange(startDate, endDate, { employee_id: 'EMP001' });

      const callArgs = mockConnection.execute.mock.calls[0];
      expect(callArgs[0]).toContain('employee_id');
    });
  });

  describe('Connection Management', () => {
    it('should release connection after each operation', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      await BFormUpload.getById('id');
      expect(mockConnection.release).toHaveBeenCalled();

      jest.clearAllMocks();
      pool.getConnection.mockResolvedValue(mockConnection);
      mockConnection.release.mockClear();

      await BFormUpload.getList();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
