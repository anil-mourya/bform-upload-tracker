const { pool } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class BFormUpload {
  // Create a new upload record
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const uploadDate = new Date();
      const expiryDate = moment().add(1, 'year').toDate();

      const [result] = await connection.execute(
        `INSERT INTO b_form_uploads
        (id, employee_id, employee_name, period, year, file_name, file_path, file_size, status, uploaded_by_id, upload_date, expiry_date, remarks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          data.employee_id,
          data.employee_name,
          data.period,
          data.year,
          data.file_name || null,
          data.file_path || null,
          data.file_size || null,
          data.status || 'uploaded',
          data.uploaded_by_id || null,
          uploadDate,
          expiryDate,
          data.remarks || null
        ]
      );

      // Log history
      await this.addHistory(id, 'created', null, 'uploaded', data.uploaded_by_id, 'Upload created');

      return { id, ...data };
    } finally {
      connection.release();
    }
  }

  // Get upload by ID
  static async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM b_form_uploads WHERE id = ?`,
        [id]
      );

      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // Get all uploads with filtering and pagination
  static async getList(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM b_form_uploads WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.period) {
        query += ' AND period = ?';
        params.push(filters.period);
      }

      if (filters.year) {
        query += ' AND year = ?';
        params.push(filters.year);
      }

      if (filters.employee_id) {
        query += ' AND employee_id LIKE ?';
        params.push(`%${filters.employee_id}%`);
      }

      if (filters.employee_name) {
        query += ' AND employee_name LIKE ?';
        params.push(`%${filters.employee_name}%`);
      }

      // Sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = (filters.sort_order || 'desc').toUpperCase();
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.execute(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM b_form_uploads WHERE 1=1';
      const countParams = [];

      if (filters.status) {
        countQuery += ' AND status = ?';
        countParams.push(filters.status);
      }

      if (filters.period) {
        countQuery += ' AND period = ?';
        countParams.push(filters.period);
      }

      if (filters.year) {
        countQuery += ' AND year = ?';
        countParams.push(filters.year);
      }

      if (filters.employee_id) {
        countQuery += ' AND employee_id LIKE ?';
        countParams.push(`%${filters.employee_id}%`);
      }

      if (filters.employee_name) {
        countQuery += ' AND employee_name LIKE ?';
        countParams.push(`%${filters.employee_name}%`);
      }

      const [countResult] = await connection.execute(countQuery, countParams);
      const total = countResult[0].total;

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  // Get uploads with not-uploaded status
  static async getNotUploaded(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM b_form_uploads WHERE status = "pending"';
      const params = [];

      if (filters.period) {
        query += ' AND period = ?';
        params.push(filters.period);
      }

      if (filters.year) {
        query += ' AND year = ?';
        params.push(filters.year);
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get statistics
  static async getStats(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let whereClause = '1=1';
      const params = [];

      if (filters.year) {
        whereClause += ' AND year = ?';
        params.push(filters.year);
      }

      if (filters.period) {
        whereClause += ' AND period = ?';
        params.push(filters.period);
      }

      const query = `
        SELECT
          COUNT(*) as total_uploads,
          SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as uploaded,
          SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(file_size) as total_file_size,
          COUNT(DISTINCT employee_id) as unique_employees
        FROM b_form_uploads
        WHERE ${whereClause}
      `;

      const [result] = await connection.execute(query, params);

      const stats = result[0];
      stats.upload_rate = stats.total_uploads > 0
        ? ((stats.uploaded + stats.verified) / stats.total_uploads * 100).toFixed(2)
        : 0;

      stats.pending_rate = stats.total_uploads > 0
        ? (stats.pending / stats.total_uploads * 100).toFixed(2)
        : 0;

      return stats;
    } finally {
      connection.release();
    }
  }

  // Update upload status
  static async updateStatus(id, status, remarks, userId) {
    const connection = await pool.getConnection();
    try {
      const upload = await this.getById(id);

      if (!upload) {
        throw new Error('Upload not found');
      }

      let verificationDate = null;
      if (status === 'verified') {
        verificationDate = new Date();
      }

      await connection.execute(
        `UPDATE b_form_uploads
        SET status = ?, remarks = ?, verified_by_id = ?, verification_date = ?, updated_at = NOW()
        WHERE id = ?`,
        [status, remarks || null, status === 'verified' ? userId : null, verificationDate, id]
      );

      await this.addHistory(id, 'status_updated', upload.status, status, userId, remarks);

      return { id, status, ...upload };
    } finally {
      connection.release();
    }
  }

  // Batch create uploads
  static async batchCreate(uploads, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const createdUploads = [];

      for (const upload of uploads) {
        const id = uuidv4();
        const uploadDate = new Date();
        const expiryDate = moment().add(1, 'year').toDate();

        await connection.execute(
          `INSERT INTO b_form_uploads
          (id, employee_id, employee_name, period, year, status, uploaded_by_id, upload_date, expiry_date, remarks, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            id,
            upload.employee_id,
            upload.employee_name,
            upload.period,
            upload.year,
            'pending',
            userId,
            uploadDate,
            expiryDate,
            upload.remarks || null
          ]
        );

        createdUploads.push({ id, ...upload });
      }

      await connection.commit();
      return createdUploads;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Add history entry
  static async addHistory(uploadId, action, oldStatus, newStatus, userId, remarks) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();

      await connection.execute(
        `INSERT INTO upload_history
        (id, upload_id, action, old_status, new_status, changed_by_id, remarks, change_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, uploadId, action, oldStatus || null, newStatus || null, userId || null, remarks || null]
      );

      return id;
    } finally {
      connection.release();
    }
  }

  // Get upload history
  static async getHistory(uploadId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT uh.*, u.full_name as changed_by_name, u.email
        FROM upload_history uh
        LEFT JOIN users u ON uh.changed_by_id = u.id
        WHERE uh.upload_id = ?
        ORDER BY uh.change_date DESC`,
        [uploadId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  // Check if upload exists for employee in period
  static async checkDuplicate(employeeId, period, year) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM b_form_uploads
        WHERE employee_id = ? AND period = ? AND year = ?`,
        [employeeId, period, year]
      );

      return rows[0].count > 0;
    } finally {
      connection.release();
    }
  }

  // Delete upload record
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM b_form_uploads WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Get expired uploads
  static async getExpiredUploads() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM b_form_uploads
        WHERE status != 'expired' AND expiry_date < NOW()`
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  // Mark uploads as expired
  static async markAsExpired(ids) {
    const connection = await pool.getConnection();
    try {
      const placeholders = ids.map(() => '?').join(',');

      await connection.execute(
        `UPDATE b_form_uploads SET status = 'expired', updated_at = NOW()
        WHERE id IN (${placeholders})`,
        ids
      );

      return ids.length;
    } finally {
      connection.release();
    }
  }

  // Get uploads by date range
  static async getByDateRange(startDate, endDate, filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT * FROM b_form_uploads
        WHERE upload_date >= ? AND upload_date <= ?`;
      const params = [startDate, endDate];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.employee_id) {
        query += ' AND employee_id = ?';
        params.push(filters.employee_id);
      }

      query += ' ORDER BY upload_date DESC';

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = BFormUpload;
