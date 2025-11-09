export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);

  // Log request body for debugging (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.token) sanitizedBody.token = '***';
    console.log(`[${timestamp}] Request body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] Response: ${res.statusCode} - ${duration}ms`);
    
    if (res.statusCode >= 400) {
      console.error(`[${timestamp}] Error response:`, data);
    }
    
    return originalJson.call(this, data);
  };

  next();
};