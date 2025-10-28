import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// Encryption utilities for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

export class EncryptionService {
  static encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Rate limiting middleware - disabled for development
export const createRateLimit = (windowMs: number, max: number) => {
  if (process.env.NODE_ENV === 'development') {
    return (req: any, res: any, next: any) => next(); // Bypass rate limiting in development
  }
  
  return rateLimit({
    windowMs,
    max,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS for HTTPS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = sanitize(value);
      }
      return cleaned;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Enhanced authorization middleware
export const requireAuth = (req: any, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user is active
  if (req.user.claims && req.user.claims.is_active === false) {
    return res.status(403).json({ message: 'Account suspended' });
  }
  
  next();
};

// Role-based authorization
export const requireRole = (role: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userRole = req.user.claims.role || 'clinic_owner';
      
      if (userRole !== role && userRole !== 'admin') {
        return res.status(403).json({ message: `${role} access required` });
      }
      
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

// IP whitelist for admin endpoints
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    return next(); // No IP restrictions if not configured
  }
  
  const clientIP = req.ip || (req.connection as any)?.remoteAddress || (req.socket as any)?.remoteAddress;
  
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ message: 'Access denied from this IP address' });
  }
  
  next();
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const logData = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?.claims?.sub || 'anonymous',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      body: req.method !== 'GET' ? req.body : undefined,
    };
    
    // Log to console (in production, this should go to a secure logging service)
    console.log('AUDIT:', JSON.stringify(logData));
    
    next();
  };
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req.session as any)?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  next();
};

// Error handling middleware (sanitize error messages)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the full error for debugging
  console.error('Error:', err);
  
  // Determine if we should show detailed error info
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let message = 'Internal server error';
  let statusCode = 500;
  
  if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
  }
  
  if (statusCode < 500 || isDevelopment) {
    message = err.message || message;
  }
  
  res.status(statusCode).json({
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
};