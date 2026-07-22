const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details
      });
    }

    req.validatedBody = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details
      });
    }

    req.validatedQuery = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details
      });
    }

    req.validatedParams = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // Upload schemas
  createUpload: Joi.object({
    employee_id: Joi.string().required().messages({
      'string.empty': 'Employee ID is required',
      'any.required': 'Employee ID is required'
    }),
    employee_name: Joi.string().required().messages({
      'string.empty': 'Employee name is required',
      'any.required': 'Employee name is required'
    }),
    period: Joi.string()
      .required()
      .valid('january', 'february', 'march', 'april', 'may', 'june',
             'july', 'august', 'september', 'october', 'november', 'december')
      .messages({
        'any.only': 'Invalid period',
        'any.required': 'Period is required'
      }),
    year: Joi.number().required().min(2000).max(2100).messages({
      'number.base': 'Year must be a number',
      'any.required': 'Year is required',
      'number.min': 'Year must be at least 2000'
    }),
    remarks: Joi.string().allow('', null).max(500)
  }),

  batchUpload: Joi.object({
    uploads: Joi.array().items(
      Joi.object({
        employee_id: Joi.string().required(),
        employee_name: Joi.string().required(),
        period: Joi.string().required().valid(
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ),
        year: Joi.number().required().min(2000).max(2100),
        remarks: Joi.string().allow('', null).max(500)
      })
    ).required().min(1).max(100)
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'uploaded', 'verified', 'rejected', 'expired').required(),
    remarks: Joi.string().allow('', null).max(500)
  }),

  // Query schemas
  listUploadsQuery: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'uploaded', 'verified', 'rejected', 'expired'),
    period: Joi.string().valid(
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ),
    year: Joi.number().min(2000).max(2100),
    employee_id: Joi.string(),
    employee_name: Joi.string(),
    sort_by: Joi.string().valid('created_at', 'upload_date', 'employee_name', 'status').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  statsQuery: Joi.object({
    year: Joi.number().min(2000).max(2100),
    period: Joi.string().valid(
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    )
  }),

  // Params schema
  uploadId: Joi.object({
    id: Joi.string().uuid().required()
  })
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};
