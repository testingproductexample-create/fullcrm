export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    status: err.status || 500,
    message: err.message || 'Internal Server Error',
    details: err.details || null
  };

  // Validation error
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.errors;
  }

  // Database error
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.status = 409;
        error.message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        error.status = 400;
        error.message = 'Referenced resource not found';
        break;
      case '23502': // Not null violation
        error.status = 400;
        error.message = 'Required field missing';
        break;
      default:
        error.status = 500;
        error.message = 'Database error';
    }
  }

  // Financial calculation errors
  if (err.type === 'FinancialCalculationError') {
    error.status = 400;
    error.message = 'Financial calculation error';
    error.details = err.calculation;
  }

  // Forecasting errors
  if (err.type === 'ForecastingError') {
    error.status = 400;
    error.message = 'Forecasting model error';
    error.details = err.model;
  }

  res.status(error.status).json({
    error: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

// Custom error classes
export class FinancialCalculationError extends Error {
  constructor(message, calculation) {
    super(message);
    this.name = 'FinancialCalculationError';
    this.type = 'FinancialCalculationError';
    this.calculation = calculation;
  }
}

export class ForecastingError extends Error {
  constructor(message, model) {
    super(message);
    this.name = 'ForecastingError';
    this.type = 'ForecastingError';
    this.model = model;
  }
}

export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}