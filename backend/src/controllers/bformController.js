const BFormUpload = require('../models/BFormUpload');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;

// List all uploads with filtering and pagination
exports.listUploads = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery;

  const result = await BFormUpload.getList(filters);

  res.json({
    success: true,
    message: 'Uploads retrieved successfully',
    data: result.data,
    pagination: result.pagination
  });
});

// Get uploads that are not yet uploaded (pending status)
exports.getNotUploaded = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery;

  const uploads = await BFormUpload.getNotUploaded(filters);

  res.json({
    success: true,
    message: 'Not uploaded items retrieved successfully',
    data: uploads,
    count: uploads.length
  });
});

// Get statistics about uploads
exports.getStats = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery;

  const stats = await BFormUpload.getStats(filters);

  res.json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: stats
  });
});

// Create a new upload record
exports.createUpload = asyncHandler(async (req, res) => {
  const { employee_id, employee_name, period, year, remarks } = req.validatedBody;

  // Check for duplicate
  const isDuplicate = await BFormUpload.checkDuplicate(employee_id, period, year);
  if (isDuplicate) {
    throw new AppError(
      'Upload record already exists for this employee in the specified period',
      409,
      'DUPLICATE_ENTRY'
    );
  }

  let fileData = {};
  if (req.file) {
    fileData = {
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size
    };
  }

  const upload = await BFormUpload.create({
    employee_id,
    employee_name,
    period,
    year,
    remarks,
    uploaded_by_id: req.userId,
    ...fileData
  });

  res.status(201).json({
    success: true,
    message: 'Upload created successfully',
    data: upload
  });
});

// Download upload file
exports.downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const upload = await BFormUpload.getById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404, 'NOT_FOUND');
  }

  if (!upload.file_path) {
    throw new AppError('No file associated with this upload', 404, 'FILE_NOT_FOUND');
  }

  try {
    await fs.access(upload.file_path);
  } catch (error) {
    throw new AppError('File not found on server', 404, 'FILE_NOT_FOUND');
  }

  res.download(upload.file_path, upload.file_name, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        code: 'DOWNLOAD_ERROR'
      });
    }
  });
});

// Get upload history
exports.getHistory = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const upload = await BFormUpload.getById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404, 'NOT_FOUND');
  }

  const history = await BFormUpload.getHistory(id);

  res.json({
    success: true,
    message: 'Upload history retrieved successfully',
    data: {
      upload: {
        id: upload.id,
        employee_id: upload.employee_id,
        employee_name: upload.employee_name,
        period: upload.period,
        year: upload.year,
        status: upload.status
      },
      history
    }
  });
});

// Batch create uploads
exports.batchCreateUploads = asyncHandler(async (req, res) => {
  const { uploads } = req.validatedBody;

  // Validate for duplicates
  const uploadMap = new Map();

  for (const upload of uploads) {
    const key = `${upload.employee_id}_${upload.period}_${upload.year}`;

    if (uploadMap.has(key)) {
      throw new AppError(
        `Duplicate entry in batch: ${upload.employee_id} - ${upload.period} ${upload.year}`,
        400,
        'DUPLICATE_IN_BATCH'
      );
    }

    uploadMap.set(key, true);

    const isDuplicate = await BFormUpload.checkDuplicate(
      upload.employee_id,
      upload.period,
      upload.year
    );

    if (isDuplicate) {
      throw new AppError(
        `Upload already exists: ${upload.employee_id} - ${upload.period} ${upload.year}`,
        409,
        'DUPLICATE_ENTRY'
      );
    }
  }

  const createdUploads = await BFormUpload.batchCreate(uploads, req.userId);

  res.status(201).json({
    success: true,
    message: 'Batch uploads created successfully',
    data: createdUploads,
    count: createdUploads.length
  });
});

// Update upload status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const { status, remarks } = req.validatedBody;

  const upload = await BFormUpload.getById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404, 'NOT_FOUND');
  }

  const validTransitions = {
    'pending': ['uploaded', 'verified', 'rejected'],
    'uploaded': ['verified', 'rejected', 'pending'],
    'verified': ['rejected'],
    'rejected': ['pending', 'uploaded'],
    'expired': ['pending', 'uploaded']
  };

  const allowedTransitions = validTransitions[upload.status] || [];
  if (!allowedTransitions.includes(status)) {
    throw new AppError(
      `Cannot transition from ${upload.status} to ${status}`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const updatedUpload = await BFormUpload.updateStatus(id, status, remarks, req.userId);

  res.json({
    success: true,
    message: 'Upload status updated successfully',
    data: updatedUpload
  });
});

// Handle bulk file uploads with metadata
exports.uploadWithFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided', 400, 'NO_FILE');
  }

  const { employee_id, employee_name, period, year, remarks } = req.validatedBody;

  const isDuplicate = await BFormUpload.checkDuplicate(employee_id, period, year);
  if (isDuplicate) {
    // Clean up uploaded file if duplicate found
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      // Ignore deletion errors
    }

    throw new AppError(
      'Upload record already exists for this employee in the specified period',
      409,
      'DUPLICATE_ENTRY'
    );
  }

  const upload = await BFormUpload.create({
    employee_id,
    employee_name,
    period,
    year,
    remarks,
    uploaded_by_id: req.userId,
    file_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: upload
  });
});

// Get single upload details
exports.getUploadDetails = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const upload = await BFormUpload.getById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Upload details retrieved successfully',
    data: upload
  });
});

// Get expired uploads and update them
exports.checkExpiredUploads = asyncHandler(async (req, res) => {
  const expiredUploads = await BFormUpload.getExpiredUploads();

  if (expiredUploads.length > 0) {
    const expiredIds = expiredUploads.map(u => u.id);
    await BFormUpload.markAsExpired(expiredIds);
  }

  res.json({
    success: true,
    message: 'Expired uploads checked and updated',
    data: {
      count: expiredUploads.length,
      expiredUploads: expiredUploads.map(u => ({
        id: u.id,
        employee_id: u.employee_id,
        employee_name: u.employee_name,
        period: u.period,
        year: u.year,
        expiry_date: u.expiry_date
      }))
    }
  });
});

// Export upload data for reporting
exports.exportUploads = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery;

  const result = await BFormUpload.getList({ ...filters, limit: 10000, page: 1 });

  // Convert to CSV format
  const csvHeaders = [
    'ID',
    'Employee ID',
    'Employee Name',
    'Period',
    'Year',
    'Status',
    'Upload Date',
    'File Name',
    'File Size',
    'Expiry Date'
  ];

  const csvRows = result.data.map(upload => [
    upload.id,
    upload.employee_id,
    upload.employee_name,
    upload.period,
    upload.year,
    upload.status,
    upload.upload_date ? new Date(upload.upload_date).toISOString() : '',
    upload.file_name || '',
    upload.file_size || '',
    upload.expiry_date ? new Date(upload.expiry_date).toISOString().split('T')[0] : ''
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bform-uploads.csv"');
  res.send(csvContent);
});

// Delete upload record
exports.deleteUpload = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const upload = await BFormUpload.getById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404, 'NOT_FOUND');
  }

  // Delete file if exists
  if (upload.file_path) {
    try {
      await fs.unlink(upload.file_path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }
  }

  const deleted = await BFormUpload.delete(id);

  if (!deleted) {
    throw new AppError('Failed to delete upload', 500, 'DELETE_FAILED');
  }

  res.json({
    success: true,
    message: 'Upload deleted successfully',
    data: { id }
  });
});

// Get uploads by date range
exports.getUploadsByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date, status, employee_id } = req.query;

  if (!start_date || !end_date) {
    throw new AppError('start_date and end_date are required', 400, 'MISSING_PARAMS');
  }

  try {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date format. Use ISO 8601 format', 400, 'INVALID_DATE');
    }

    const uploads = await BFormUpload.getByDateRange(startDate, endDate, {
      status,
      employee_id
    });

    res.json({
      success: true,
      message: 'Uploads retrieved successfully',
      data: uploads,
      count: uploads.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid date format', 400, 'INVALID_DATE');
  }
});

module.exports = exports;
