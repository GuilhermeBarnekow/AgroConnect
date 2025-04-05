const config = require('../config');

const errorMiddleware = (err, req, res, next) => {
  // Log the error stack for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Determine if we should include detailed error info
  const isDevelopment = config.server.env === 'development';
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    details: isDevelopment ? err.details || null : null,
    stack: isDevelopment ? err.stack : null,
    path: req.path,
    method: req.method
  });
};

module.exports = errorMiddleware;
