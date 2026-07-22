class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.details || err.message
    });
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let code = 'UPLOAD_ERROR';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit';
      code = 'FILE_TOO_LARGE';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
      code = 'TOO_MANY_FILES';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
      code = 'INVALID_FILE_FIELD';
    }

    return res.status(400).json({
      success: false,
      message,
      code
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found',
      code: 'REFERENCED_RECORD_NOT_FOUND'
    });
  }

  console.error('Unhandled error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};
