// Authentication middleware for financial data
export const authMiddleware = (req, res, next) => {
  // For now, allow all requests in development
  // In production, implement proper JWT token validation
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (process.env.NODE_ENV === 'production' && !token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication token required' 
    });
  }
  
  // In production, validate the token here
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = decoded;
  
  req.user = { id: 'demo-user', company_id: 'demo-company' };
  next();
};

// Role-based access control for financial data
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Company context middleware
export const requireCompany = (req, res, next) => {
  const companyId = req.headers['x-company-id'] || req.params.companyId || req.query.companyId;
  
  if (!companyId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Company ID is required'
    });
  }
  
  req.companyId = companyId;
  next();
};