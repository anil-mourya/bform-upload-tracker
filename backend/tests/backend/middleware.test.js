const jwt = require('jsonwebtoken');
const {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  generateToken
} = require('../../src/middleware/auth');
const {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
} = require('../../src/middleware/validation');
const { AppError, errorHandler, asyncHandler } = require('../../src/middleware/errorHandler');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, params: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should authenticate valid token', () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.userId).toBe('user-123');
      expect(req.userRole).toBe('admin');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing authorization header', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'AUTH_MISSING',
          message: expect.stringContaining('Authorization header')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET
      );
      req.headers.authorization = token;

      authMiddleware(req, res, next);

      expect(req.userId).toBe('user-123');
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token-xyz';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INVALID_TOKEN' })
      );
    });

    it('should reject expired token', () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'TOKEN_EXPIRED' })
      );
    });

    it('should extract user information from token', () => {
      const token = jwt.sign(
        {
          id: 'user-456',
          email: 'admin@example.com',
          role: 'manager',
          full_name: 'Admin User'
        },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toEqual({
        id: 'user-456',
        email: 'admin@example.com',
        role: 'manager',
        full_name: 'Admin User'
      });
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should authenticate if token provided', () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer ${token}`;

      optionalAuthMiddleware(req, res, next);

      expect(req.userId).toBe('user-123');
      expect(next).toHaveBeenCalled();
    });

    it('should skip auth if no token provided', () => {
      optionalAuthMiddleware(req, res, next);

      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should skip auth if invalid token provided', () => {
      req.headers.authorization = 'Bearer invalid-token';

      optionalAuthMiddleware(req, res, next);

      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should always call next', () => {
      optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow users with required role', () => {
      req.userRole = 'admin';
      const middleware = requireRole('admin', 'manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow if user has one of multiple required roles', () => {
      req.userRole = 'manager';
      const middleware = requireRole('admin', 'manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject if role not in allowed list', () => {
      req.userRole = 'user';
      req.user = { id: 'user-123' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INSUFFICIENT_PERMISSIONS' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if no user authenticated', () => {
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'AUTH_REQUIRED' })
      );
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        full_name: 'Test User'
      };

      const token = generateToken(user);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toEqual(expect.objectContaining(user));
    });

    it('should include all user fields in token', () => {
      const user = {
        id: 'user-789',
        email: 'admin@example.com',
        role: 'manager',
        full_name: 'Manager User'
      };

      const token = generateToken(user);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe('user-789');
      expect(decoded.email).toBe('admin@example.com');
      expect(decoded.role).toBe('manager');
      expect(decoded.full_name).toBe('Manager User');
    });

    it('should set expiration', () => {
      const user = { id: 'user-123', email: 'test@example.com', role: 'admin' };

      const token = generateToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });
});

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('validateRequest', () => {
    it('should validate and pass valid data', () => {
      const middleware = validateRequest(schemas.createUpload);
      req.body = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 2024
      };

      middleware(req, res, next);

      expect(req.validatedBody).toBeDefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid data', () => {
      const middleware = validateRequest(schemas.createUpload);
      req.body = { employee_id: 'EMP001' }; // Missing required fields

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.any(Array)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const middleware = validateRequest(schemas.createUpload);
      req.body = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 2024,
        unknown_field: 'should_be_stripped'
      };

      middleware(req, res, next);

      expect(req.validatedBody.unknown_field).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should validate period enum', () => {
      const middleware = validateRequest(schemas.createUpload);
      req.body = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'invalid_month',
        year: 2024
      };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate year range', () => {
      const middleware = validateRequest(schemas.createUpload);
      req.body = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        period: 'january',
        year: 1999
      };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', () => {
      const middleware = validateQuery(schemas.listUploadsQuery);
      req.query = { page: 1, limit: 10 };

      middleware(req, res, next);

      expect(req.validatedQuery).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid query parameters', () => {
      const middleware = validateQuery(schemas.listUploadsQuery);
      req.query = { page: 0 };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should apply defaults', () => {
      const middleware = validateQuery(schemas.listUploadsQuery);
      req.query = {};

      middleware(req, res, next);

      expect(req.validatedQuery.page).toBe(1);
      expect(req.validatedQuery.limit).toBe(10);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should validate URL parameters', () => {
      const middleware = validateParams(schemas.uploadId);
      req.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      middleware(req, res, next);

      expect(req.validatedParams).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid UUID', () => {
      const middleware = validateParams(schemas.uploadId);
      req.params = { id: 'not-a-uuid' };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas', () => {
    describe('createUpload schema', () => {
      it('should accept valid upload data', () => {
        const { error } = schemas.createUpload.validate({
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024,
          remarks: 'Test upload'
        });

        expect(error).toBeUndefined();
      });

      it('should allow empty remarks', () => {
        const { error } = schemas.createUpload.validate({
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024,
          remarks: ''
        });

        expect(error).toBeUndefined();
      });

      it('should reject remarks over 500 chars', () => {
        const { error } = schemas.createUpload.validate({
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          period: 'january',
          year: 2024,
          remarks: 'x'.repeat(501)
        });

        expect(error).toBeDefined();
      });
    });

    describe('updateStatus schema', () => {
      it('should accept valid status values', () => {
        const validStatuses = ['pending', 'uploaded', 'verified', 'rejected', 'expired'];

        validStatuses.forEach(status => {
          const { error } = schemas.updateStatus.validate({ status });
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid status', () => {
        const { error } = schemas.updateStatus.validate({ status: 'invalid' });

        expect(error).toBeDefined();
      });
    });
  });
});

describe('Error Handling Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    process.env.NODE_ENV = 'test';
  });

  describe('AppError', () => {
    it('should create custom error with message, status, and code', () => {
      const error = new AppError('Test error', 400, 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should have timestamp', () => {
      const error = new AppError('Test error', 400);

      expect(error.timestamp).toBeDefined();
    });

    it('should default code to INTERNAL_ERROR', () => {
      const error = new AppError('Test error', 500);

      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', 400, 'TEST_CODE');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Test error',
          code: 'TEST_CODE'
        })
      );
    });

    it('should handle validation errors', () => {
      const error = new Error('Validation error');
      error.name = 'ValidationError';
      error.details = [{ field: 'email', message: 'Invalid email' }];

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('should handle multer file upload errors', () => {
      const error = new Error('File size exceeds limit');
      error.name = 'MulterError';
      error.code = 'LIMIT_FILE_SIZE';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FILE_TOO_LARGE' })
      );
    });

    it('should handle database duplicate entry error', () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'DUPLICATE_ENTRY' })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' })
      );
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new AppError('Dev error', 400);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.any(String) })
      );
    });

    it('should exclude stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError('Prod error', 400);

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.stack).toBeUndefined();
    });
  });

  describe('asyncHandler', () => {
    it('should catch promise rejections', async () => {
      const error = new Error('Async error');
      const fn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(fn);

      await wrapped({}, {}, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should call next on rejection', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test'));
      const wrapped = asyncHandler(fn);

      await wrapped({}, {}, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow normal execution', async () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(fn);

      await wrapped({}, {}, next);

      expect(fn).toHaveBeenCalled();
    });
  });
});
