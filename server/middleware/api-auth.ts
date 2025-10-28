import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { apiKeys, clinics, apiUsage, rateLimitBuckets } from '@shared/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import bcrypt from 'bcrypt';

interface ApiRequest extends Request {
  clinic?: any;
  apiKey?: any;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
}

// API Key Authentication Middleware
export const apiKeyAuth = async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'API key required. Format: Authorization: Bearer pk_live_...'
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Extract key prefix for database lookup
    const keyParts = apiKey.split('.');
    if (keyParts.length !== 2) {
      return res.status(401).json({
        error: 'invalid_key',
        message: 'Invalid API key format'
      });
    }

    const [keyPrefix, keySecret] = keyParts;

    // Find API key in database
    const [dbKey] = await db
      .select({
        id: apiKeys.id,
        clinicId: apiKeys.clinicId,
        keyName: apiKeys.keyName,
        hashedKey: apiKeys.hashedKey,
        permissions: apiKeys.permissions,
        status: apiKeys.status,
        expiresAt: apiKeys.expiresAt,
        environment: apiKeys.environment,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyPrefix, keyPrefix),
          eq(apiKeys.status, 'active')
        )
      );

    if (!dbKey) {
      return res.status(401).json({
        error: 'invalid_key',
        message: 'API key not found or inactive'
      });
    }

    // Check if key is expired
    if (dbKey.expiresAt && new Date() > dbKey.expiresAt) {
      return res.status(401).json({
        error: 'expired_key',
        message: 'API key has expired'
      });
    }

    // Verify key secret
    const isValidKey = await bcrypt.compare(apiKey, dbKey.hashedKey);
    if (!isValidKey) {
      return res.status(401).json({
        error: 'invalid_key',
        message: 'Invalid API key'
      });
    }

    // Get clinic information
    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, dbKey.clinicId));

    if (!clinic || clinic.status === 'suspended') {
      return res.status(403).json({
        error: 'clinic_suspended',
        message: 'Clinic access suspended'
      });
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, dbKey.id));

    // Attach to request
    req.clinic = clinic;
    req.apiKey = dbKey;

    next();
  } catch (error) {
    console.error('API auth error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Authentication failed'
    });
  }
};

// Permission Check Middleware
export const requirePermission = (permission: string) => {
  return (req: ApiRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey?.permissions?.includes(permission)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: `Missing required permission: ${permission}`,
        required_permission: permission
      });
    }
    next();
  };
};

// Rate Limiting Middleware
export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: ApiRequest) => string;
}) => {
  return async (req: ApiRequest, res: Response, next: NextFunction) => {
    try {
      const { windowMs, maxRequests, keyGenerator } = options;
      
      // Generate rate limit key
      const rateLimitKey = keyGenerator 
        ? keyGenerator(req)
        : `${req.clinic?.id}:${req.route?.path || req.path}`;

      const now = new Date();
      const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
      const windowEnd = new Date(windowStart.getTime() + windowMs);
      
      const bucketId = `${rateLimitKey}:${windowStart.getTime()}`;

      // Get or create rate limit bucket
      const [bucket] = await db
        .select()
        .from(rateLimitBuckets)
        .where(eq(rateLimitBuckets.id, bucketId));

      let currentCount = 0;

      if (bucket) {
        currentCount = bucket.requestCount + 1;
        
        // Update existing bucket
        await db
          .update(rateLimitBuckets)
          .set({
            requestCount: currentCount,
            updatedAt: now,
          })
          .where(eq(rateLimitBuckets.id, bucketId));
      } else {
        // Create new bucket
        currentCount = 1;
        await db
          .insert(rateLimitBuckets)
          .values({
            id: bucketId,
            requestCount: currentCount,
            windowStart,
            windowEnd,
          });
      }

      // Check rate limit
      if (currentCount > maxRequests) {
        const resetTime = Math.ceil(windowEnd.getTime() / 1000);
        
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
        });

        return res.status(429).json({
          error: 'rate_limit_exceeded',
          message: 'Too many requests',
          limit: maxRequests,
          reset_time: resetTime,
        });
      }

      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - currentCount);
      const resetTime = Math.ceil(windowEnd.getTime() / 1000);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      });

      req.rateLimitInfo = {
        remaining,
        resetTime,
        limit: maxRequests,
      };

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Allow request to continue if rate limiting fails
    }
  };
};

// API Usage Tracking Middleware
export const trackApiUsage = async (req: ApiRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Track API usage asynchronously
    setImmediate(async () => {
      try {
        await db.insert(apiUsage).values({
          clinicId: req.clinic?.id,
          apiKeyId: req.apiKey?.id,
          endpoint: `${req.method} ${req.route?.path || req.path}`,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length'] as string) : 0,
          responseSize: Buffer.isBuffer(body) ? body.length : JSON.stringify(body).length,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      } catch (error) {
        console.error('API usage tracking error:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
};

// Cleanup expired rate limit buckets (run periodically)
export const cleanupRateLimitBuckets = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await db
      .delete(rateLimitBuckets)
      .where(lte(rateLimitBuckets.windowEnd, oneHourAgo));
      
    console.log('Cleaned up expired rate limit buckets');
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
};