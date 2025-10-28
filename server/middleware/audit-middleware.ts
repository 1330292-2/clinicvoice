import { AuditService } from "../services/audit-service";

// Middleware to automatically log all API actions
export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Capture request details
    const startTime = Date.now();
    const userId = req.user?.claims?.sub || req.user?.id || 'anonymous';
    const clinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
    const entityId = req.params.id || req.params.appointmentId || req.params.callId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    let responseData: any;
    let successful = true;
    let errorMessage: string | undefined;

    // Override res.json to capture response
    res.json = function(data: any) {
      responseData = data;
      successful = res.statusCode < 400;
      if (!successful) {
        errorMessage = data.message || `HTTP ${res.statusCode}`;
      }
      return originalJson.call(this, data);
    };

    // Override res.send to capture response
    res.send = function(data: any) {
      if (!responseData) {
        responseData = data;
        successful = res.statusCode < 400;
        if (!successful) {
          errorMessage = typeof data === 'string' ? data : `HTTP ${res.statusCode}`;
        }
      }
      return originalSend.call(this, data);
    };

    // Continue with request
    const originalEnd = res.end;
    res.end = async function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // Log the action after response is sent
      try {
        const details: any = {
          method: req.method,
          url: req.originalUrl,
          duration,
          statusCode: res.statusCode,
        };

        // Add request body for non-GET requests (excluding sensitive data)
        if (req.method !== 'GET' && req.body) {
          const sanitizedBody = AuditService.redactPII(req.body, ['password', 'token', 'secret']);
          details.requestData = sanitizedBody;
        }

        // Add response data for successful operations (limited size)
        if (successful && responseData) {
          const responseStr = JSON.stringify(responseData);
          if (responseStr.length < 1000) { // Avoid logging huge responses
            details.responseData = responseData;
          } else {
            details.responseSize = responseStr.length;
          }
        }

        await AuditService.logAction({
          userId,
          clinicId,
          action,
          entityType,
          entityId,
          details,
          ipAddress,
          userAgent,
          successful,
          errorMessage,
        });
      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't fail the request if audit logging fails
      }

      return originalEnd.apply(this, args);
    };

    next();
  };
};

// Specific audit middleware for common operations
export const auditRead = (entityType: string) => auditMiddleware('READ', entityType);
export const auditCreate = (entityType: string) => auditMiddleware('CREATE', entityType);
export const auditUpdate = (entityType: string) => auditMiddleware('UPDATE', entityType);
export const auditDelete = (entityType: string) => auditMiddleware('DELETE', entityType);
export const auditExport = (entityType: string) => auditMiddleware('EXPORT', entityType);
export const auditLogin = () => auditMiddleware('LOGIN', 'user');
export const auditLogout = () => auditMiddleware('LOGOUT', 'user');

// HIPAA-specific audit events
export const auditAccessPatientData = auditMiddleware('ACCESS_PATIENT_DATA', 'patient_data');
export const auditCreatePatientRecord = auditMiddleware('CREATE_PATIENT_RECORD', 'patient_data');
export const auditModifyPatientRecord = auditMiddleware('MODIFY_PATIENT_RECORD', 'patient_data');
export const auditDeletePatientRecord = auditMiddleware('DELETE_PATIENT_RECORD', 'patient_data');

// GDPR-specific audit events
export const auditDataExport = auditMiddleware('GDPR_DATA_EXPORT', 'personal_data');
export const auditDataDeletion = auditMiddleware('GDPR_DATA_DELETION', 'personal_data');
export const auditConsentChange = auditMiddleware('CONSENT_CHANGE', 'consent_record');