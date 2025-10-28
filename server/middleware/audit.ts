import { db } from '../db';
import { auditLogs } from '@shared/schema';

export interface AuditLogData {
  userId: string;
  clinicId?: string;
  action: string; // CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN, etc.
  entityType: string; // appointment, call_log, patient_data, etc.
  entityId?: string;
  details?: Record<string, any>;
  successful?: boolean;
  errorMessage?: string;
}

/**
 * HIPAA Compliance: Audit logging middleware
 * Logs all access to Protected Health Information (PHI)
 * Retention period: 7 years as required by HIPAA
 */
export async function logAudit(req: any, data: AuditLogData): Promise<void> {
  try {
    // Extract IP address (handle proxies)
    const ipAddress = 
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];

    // Calculate retention date (7 years for HIPAA)
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);

    await db.insert(auditLogs).values({
      userId: data.userId,
      clinicId: data.clinicId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details,
      ipAddress,
      userAgent,
      successful: data.successful ?? true,
      errorMessage: data.errorMessage,
      retentionDate,
    });
  } catch (error) {
    // Never fail the request due to audit logging errors
    // but log the error for monitoring
    console.error('Audit logging failed:', error);
  }
}

/**
 * Express middleware for automatic audit logging
 * Use this on routes that access PHI
 */
export function auditMiddleware(entityType: string) {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    
    // Intercept the response to log after successful operations
    res.json = function(data: any) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.claims?.sub;
        if (!userId) {
          return originalJson(data);
        }
        
        const action = getActionFromMethod(req.method);
        
        logAudit(req, {
          userId,
          action,
          entityType,
          entityId: req.params.id || req.params.clinicId || req.params.appointmentId,
          details: {
            path: req.path,
            method: req.method,
            query: req.query,
          },
          successful: true
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

function getActionFromMethod(method: string): string {
  switch (method) {
    case 'GET':
      return 'READ';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'READ';
  }
}
