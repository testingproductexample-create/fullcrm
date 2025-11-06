const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { User, UserSession } = require('../models');
const { auditLogger } = require('../services/audit');
const { rateLimit } = require('express-rate-limit');

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// User registration
router.post('/register', authRateLimit, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      auditLogger.logSecurityIncident('DUPLICATE_REGISTRATION_ATTEMPT', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'secure-file-storage',
        audience: 'secure-file-storage-users'
      }
    );

    // Create session record
    await UserSession.create({
      userId: user.id,
      token: token,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    auditLogger.logEvent('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });

  } catch (error) {
    auditLogger.logError('USER_REGISTRATION_ERROR', error, { email: req.body.email });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', authRateLimit, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      auditLogger.logSecurityIncident('LOGIN_ATTEMPT_INVALID_USER', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      auditLogger.logSecurityIncident('LOGIN_ATTEMPT_LOCKED_ACCOUNT', {
        userId: user.id,
        email,
        ip: req.ip
      });
      return res.status(423).json({ 
        error: 'Account is locked. Please try again later.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const lockThreshold = 5;
      
      let updateData = { 
        loginAttempts: attempts,
        lastLoginAttempt: new Date()
      };

      // Lock account after 5 failed attempts
      if (attempts >= lockThreshold) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        auditLogger.logSecurityIncident('ACCOUNT_LOCKED', {
          userId: user.id,
          email,
          attempts,
          ip: req.ip
        });
      }

      await user.update(updateData);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.update({
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
      lastLoginIp: req.ip
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'secure-file-storage',
        audience: 'secure-file-storage-users'
      }
    );

    // Create session record
    await UserSession.create({
      userId: user.id,
      token: token,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    auditLogger.logEvent('USER_LOGIN', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    });

  } catch (error) {
    auditLogger.logError('USER_LOGIN_ERROR', error, { email: req.body.email });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if session exists
    const session = await UserSession.findOne({
      where: { 
        userId: user.id,
        token: token,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!session) {
      auditLogger.logSecurityIncident('INVALID_SESSION_REFRESH', {
        userId: user.id,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'secure-file-storage',
        audience: 'secure-file-storage-users'
      }
    );

    // Update session
    await session.update({
      token: newToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    auditLogger.logEvent('TOKEN_REFRESHED', {
      userId: user.id,
      ip: req.ip
    });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    auditLogger.logError('TOKEN_REFRESH_ERROR', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      // Find and delete session
      const session = await UserSession.findOne({ where: { token } });
      if (session) {
        await session.destroy();
        
        const user = await User.findByPk(session.userId);
        if (user) {
          auditLogger.logEvent('USER_LOGOUT', {
            userId: user.id,
            ip: req.ip
          });
        }
      }
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    auditLogger.logError('USER_LOGOUT_ERROR', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
  try {
    const { token } = req.headers;
    const { currentPassword, newPassword } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      auditLogger.logSecurityIncident('PASSWORD_CHANGE_INVALID_CURRENT', {
        userId: user.id,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({
      password: hashedNewPassword,
      lastPasswordChange: new Date()
    });

    // Invalidate all existing sessions
    await UserSession.destroy({
      where: { userId: user.id }
    });

    auditLogger.logEvent('PASSWORD_CHANGED', {
      userId: user.id,
      ip: req.ip
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    auditLogger.logError('PASSWORD_CHANGE_ERROR', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const { token } = req.headers;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    auditLogger.logError('GET_PROFILE_ERROR', error);
    res.status(401).json({ error: 'Authentication required' });
  }
});

module.exports = router;