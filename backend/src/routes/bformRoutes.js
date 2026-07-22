const express = require('express');
const router = express.Router();
const bformController = require('../controllers/bformController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest, validateQuery, validateParams, schemas } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExt = ['.pdf', '.doc', '.docx'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800
  },
  fileFilter
});

// GET /api/bform/uploads/list - Get all uploads with filtering and pagination
router.get(
  '/uploads/list',
  authMiddleware,
  validateQuery(schemas.listUploadsQuery),
  bformController.listUploads
);

// GET /api/bform/uploads/not-uploaded - Get uploads with pending status
router.get(
  '/uploads/not-uploaded',
  authMiddleware,
  validateQuery(schemas.statsQuery),
  bformController.getNotUploaded
);

// GET /api/bform/uploads/stats - Get statistics
router.get(
  '/uploads/stats',
  authMiddleware,
  validateQuery(schemas.statsQuery),
  bformController.getStats
);

// GET /api/bform/uploads/export - Export uploads as CSV
router.get(
  '/uploads/export',
  authMiddleware,
  requireRole('admin', 'manager'),
  validateQuery(schemas.listUploadsQuery),
  bformController.exportUploads
);

// GET /api/bform/uploads/check-expired - Check and mark expired uploads
router.get(
  '/uploads/check-expired',
  authMiddleware,
  requireRole('admin', 'manager'),
  bformController.checkExpiredUploads
);

// GET /api/bform/uploads/date-range - Get uploads by date range
router.get(
  '/uploads/date-range',
  authMiddleware,
  bformController.getUploadsByDateRange
);

// POST /api/bform/uploads - Create a new upload record
router.post(
  '/uploads',
  authMiddleware,
  upload.single('file'),
  validateRequest(schemas.createUpload),
  bformController.uploadWithFile
);

// POST /api/bform/uploads/batch - Batch create upload records
router.post(
  '/uploads/batch',
  authMiddleware,
  requireRole('admin', 'manager'),
  validateRequest(schemas.batchUpload),
  bformController.batchCreateUploads
);

// GET /api/bform/uploads/:id/download - Download file
router.get(
  '/uploads/:id/download',
  authMiddleware,
  validateParams(schemas.uploadId),
  bformController.downloadFile
);

// GET /api/bform/uploads/:id/history - Get upload history
router.get(
  '/uploads/:id/history',
  authMiddleware,
  validateParams(schemas.uploadId),
  bformController.getHistory
);

// GET /api/bform/uploads/:id - Get single upload details
router.get(
  '/uploads/:id',
  authMiddleware,
  validateParams(schemas.uploadId),
  bformController.getUploadDetails
);

// PATCH /api/bform/uploads/:id/status - Update upload status
router.patch(
  '/uploads/:id/status',
  authMiddleware,
  validateParams(schemas.uploadId),
  validateRequest(schemas.updateStatus),
  bformController.updateStatus
);

// DELETE /api/bform/uploads/:id - Delete upload record
router.delete(
  '/uploads/:id',
  authMiddleware,
  requireRole('admin'),
  validateParams(schemas.uploadId),
  bformController.deleteUpload
);

module.exports = router;
