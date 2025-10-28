import { db } from "../db";
import { auditLogs, dataRetentionPolicies, type InsertAuditLog } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

export class AuditService {
  // Log any action for compliance tracking
  static async logAction(params: {
    userId: string;
    clinicId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    successful?: boolean;
    errorMessage?: string;
  }) {
    try {
      // Calculate retention date based on data type
      const retentionDate = await this.calculateRetentionDate(params.entityType);
      
      const auditLog: InsertAuditLog = {
        userId: params.userId,
        clinicId: params.clinicId,
        action: params.action.toUpperCase(),
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        successful: params.successful ?? true,
        errorMessage: params.errorMessage,
        retentionDate,
      };

      await db.insert(auditLogs).values(auditLog);
    } catch (error) {
      console.error("Failed to log audit action:", error);
      // Don't throw - audit logging failure shouldn't break business operations
    }
  }

  // Calculate when this audit log should be deleted based on data retention policies
  private static async calculateRetentionDate(entityType: string): Promise<Date | null> {
    try {
      const [policy] = await db
        .select()
        .from(dataRetentionPolicies)
        .where(and(
          eq(dataRetentionPolicies.dataType, entityType),
          eq(dataRetentionPolicies.isActive, true)
        ));

      if (policy) {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() + policy.retentionPeriodDays);
        return retentionDate;
      }

      // Default to 7 years for healthcare data if no specific policy
      const defaultRetention = new Date();
      defaultRetention.setFullYear(defaultRetention.getFullYear() + 7);
      return defaultRetention;
    } catch (error) {
      console.error("Error calculating retention date:", error);
      return null;
    }
  }

  // Initialize default data retention policies
  static async initializeDefaultPolicies() {
    try {
      const defaultPolicies = [
        {
          dataType: "call_logs",
          retentionPeriodDays: 2555, // 7 years for healthcare records
          description: "Patient call recordings and transcripts",
          legalBasis: "HIPAA",
        },
        {
          dataType: "appointments",
          retentionPeriodDays: 2555, // 7 years
          description: "Appointment booking and scheduling records",
          legalBasis: "HIPAA",
        },
        {
          dataType: "audit_logs",
          retentionPeriodDays: 2190, // 6 years for audit trails
          description: "System access and action audit trails",
          legalBasis: "HIPAA",
        },
        {
          dataType: "user",
          retentionPeriodDays: 1095, // 3 years after account deletion
          description: "User account and profile information",
          legalBasis: "GDPR",
        },
        {
          dataType: "consent_records",
          retentionPeriodDays: 2190, // 6 years to prove compliance
          description: "Patient consent and withdrawal records",
          legalBasis: "GDPR",
        },
      ];

      for (const policy of defaultPolicies) {
        // Only insert if doesn't already exist
        const existing = await db
          .select()
          .from(dataRetentionPolicies)
          .where(eq(dataRetentionPolicies.dataType, policy.dataType));

        if (existing.length === 0) {
          await db.insert(dataRetentionPolicies).values(policy);
        }
      }
    } catch (error) {
      console.error("Error initializing default retention policies:", error);
    }
  }

  // Clean up expired audit logs based on retention policies
  static async cleanupExpiredLogs() {
    try {
      const now = new Date();
      const deletedLogs = await db
        .delete(auditLogs)
        .where(and(
          lt(auditLogs.retentionDate, now)
        ))
        .returning({ id: auditLogs.id });

      console.log(`Cleaned up ${deletedLogs.length} expired audit logs`);
      
      // Log the cleanup action itself
      await this.logAction({
        userId: "system",
        action: "CLEANUP_EXPIRED_LOGS",
        entityType: "audit_logs",
        details: { deletedCount: deletedLogs.length },
        successful: true,
      });

      return deletedLogs.length;
    } catch (error) {
      console.error("Error cleaning up expired logs:", error);
      
      await this.logAction({
        userId: "system",
        action: "CLEANUP_EXPIRED_LOGS",
        entityType: "audit_logs",
        successful: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      return 0;
    }
  }

  // Get audit trail for a specific entity
  static async getAuditTrail(entityType: string, entityId: string, limit = 100) {
    try {
      return await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        ))
        .orderBy(auditLogs.timestamp)
        .limit(limit);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      return [];
    }
  }

  // PII redaction for GDPR compliance
  static redactPII(data: any, fieldsToRedact: string[] = ['phone', 'email', 'name', 'address']): any {
    if (!data || typeof data !== 'object') return data;

    const redacted = { ...data };
    
    for (const field of fieldsToRedact) {
      if (redacted[field]) {
        if (field === 'phone') {
          // Keep country code and first 3 digits, redact rest
          redacted[field] = redacted[field].replace(/(\+\d{1,3})(\d{3})(\d+)/, '$1$2***');
        } else if (field === 'email') {
          // Keep first letter and domain
          redacted[field] = redacted[field].replace(/(.)(.*?)(@.*)/, '$1***$3');
        } else {
          // Generic redaction
          redacted[field] = '***REDACTED***';
        }
      }
    }

    return redacted;
  }

  // Check if data processing is compliant
  static async isProcessingCompliant(clinicId: string, dataType: string): Promise<boolean> {
    try {
      // In a full implementation, this would check:
      // 1. Valid consent records
      // 2. Active vendor agreements
      // 3. Current retention policies
      // 4. No active data breach incidents affecting this clinic
      
      // For now, return true as baseline
      return true;
    } catch (error) {
      console.error("Error checking processing compliance:", error);
      return false;
    }
  }
}