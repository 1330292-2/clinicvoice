import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  varchar,
  index,
  decimal,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("clinic_owner"), // clinic_owner, admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clinics table
export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  address: text("address"),
  email: varchar("email"),
  website: varchar("website"),
  description: text("description"),
  logo: text("logo"), // URL to logo image  
  subscriptionStatus: text("subscription_status").default("trial"),
  subscriptionTier: text("subscription_tier").default("basic"),
  billingCycle: varchar("billing_cycle").default("monthly"), // monthly, yearly
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  totalCalls: integer("total_calls").notNull().default(0),
  totalAppointments: integer("total_appointments").notNull().default(0),
  monthlyCallsUsed: integer("monthly_calls_used").notNull().default(0),
  callsLimit: integer("calls_limit").notNull().default(100),
  currency: text("currency").default("GBP"),
  googleSheetsId: text("google_sheets_id"),
  isActive: boolean("is_active").notNull().default(true),
  // Tenant lifecycle management fields
  status: varchar("status").default("active"), // active, suspended, deleted
  suspensionReason: text("suspension_reason"),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: varchar("suspended_by"),
  reactivatedAt: timestamp("reactivated_at"),
  reactivatedBy: varchar("reactivated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Call logs table
export const callLogs: any = pgTable("call_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  twilioCallSid: varchar("twilio_call_sid"),
  callerPhone: text("caller_phone").notNull(),
  toNumber: varchar("to_number"),
  callType: varchar("call_type").default("inbound"), // inbound, outbound
  transcript: text("transcript"),
  summary: text("summary"),
  duration: integer("duration"),
  callStatus: text("call_status").default("completed"),
  recording: text("recording"), // URL to call recording
  sentimentScore: real("sentiment_score"),
  appointmentBooked: boolean("appointment_booked").default(false),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  cost: real("cost").default(0.0000),
  exportedToFile: boolean("exported_to_file").notNull().default(false),
  fileExportPath: text("file_export_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments table
export const appointments: any = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  callLogId: uuid("call_log_id").references(() => callLogs.id),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"),
  patientEmail: varchar("patient_email"),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type"),
  duration: integer("duration").default(30), // minutes
  status: text("status").default("scheduled"), // scheduled, confirmed, cancelled, completed, no_show
  notes: text("notes"),
  price: real("price"),
  isPaid: boolean("is_paid").notNull().default(false),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  exportedToFile: boolean("exported_to_file").notNull().default(false),
  fileExportPath: text("file_export_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI configurations table
export const aiConfigurations = pgTable("ai_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  greetingMessage: text("greeting_message").default("Hello! Thank you for calling. How can I help you today?"),
  businessHours: jsonb("business_hours").default({
    monday: { open: "09:00", close: "17:00" },
    tuesday: { open: "09:00", close: "17:00" },
    wednesday: { open: "09:00", close: "17:00" },
    thursday: { open: "09:00", close: "17:00" },
    friday: { open: "09:00", close: "17:00" },
    saturday: { closed: true },
    sunday: { closed: true }
  }),
  services: jsonb("services").default([]),
  personalityTraits: text("personality_traits").default("professional, empathetic, helpful"),
  elevenlabsApiKey: text("elevenlabs_api_key"),
  elevenlabsVoiceId: text("elevenlabs_voice_id"),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API configurations table
export const apiConfigurations = pgTable("api_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  googleServiceAccountKey: jsonb("google_service_account_key"),
  elevenlabsApiKey: text("elevenlabs_api_key"),
  elevenlabsVoiceId: text("elevenlabs_voice_id"),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema exports
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiConfigurationSchema = createInsertSchema(aiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Platform analytics for admin dashboard
export const platformAnalytics = pgTable("platform_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  totalClinics: integer("total_clinics").notNull().default(0),
  activeClinics: integer("active_clinics").notNull().default(0),
  totalCalls: integer("total_calls").notNull().default(0),
  totalAppointments: integer("total_appointments").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  newSignups: integer("new_signups").notNull().default(0),
  churnedClinics: integer("churned_clinics").notNull().default(0),
  averageCallDuration: integer("average_call_duration").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// File exports tracking
export const fileExports = pgTable("file_exports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  exportType: varchar("export_type").notNull(), // appointments, calls, analytics
  fileName: varchar("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileFormat: varchar("file_format").notNull().default("csv"), // csv, xlsx, json
  recordCount: integer("record_count").notNull().default(0),
  fileSize: integer("file_size"), // bytes
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance and Audit Logging Tables
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN, etc.
  entityType: varchar("entity_type").notNull(), // user, clinic, appointment, call_log, etc.
  entityId: varchar("entity_id"), // ID of the affected entity
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  successful: boolean("successful").notNull().default(true),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  retentionDate: timestamp("retention_date"), // When this log should be deleted
});

export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: serial("id").primaryKey(),
  dataType: varchar("data_type").notNull().unique(), // call_logs, appointments, audit_logs, etc.
  retentionPeriodDays: integer("retention_period_days").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  legalBasis: varchar("legal_basis"), // HIPAA, GDPR, business_requirement
  lastProcessed: timestamp("last_processed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  patientIdentifier: varchar("patient_identifier"), // Phone number or anonymized ID
  consentType: varchar("consent_type").notNull(), // data_processing, marketing, recording
  consentStatus: boolean("consent_status").notNull(), // true = granted, false = withdrawn
  consentMethod: varchar("consent_method"), // verbal, written, digital
  consentVersion: varchar("consent_version"), // Version of terms they consented to
  grantedAt: timestamp("granted_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  expiresAt: timestamp("expires_at"),
  legalBasis: varchar("legal_basis"), // legitimate_interest, consent, contract
  processingPurpose: text("processing_purpose"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataBreachIncidents = pgTable("data_breach_incidents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull().unique(), // Generated incident reference
  severity: varchar("severity").notNull(), // low, medium, high, critical
  status: varchar("status").notNull().default("open"), // open, investigating, resolved, closed
  affectedClinics: text("affected_clinics").array(), // Array of clinic IDs
  affectedDataTypes: text("affected_data_types").array(), // personal, health, financial
  estimatedRecordsAffected: integer("estimated_records_affected"),
  detectionMethod: varchar("detection_method"), // automated, manual, external_report
  incidentDescription: text("incident_description").notNull(),
  rootCause: text("root_cause"),
  remediationSteps: text("remediation_steps"),
  notificationRequired: boolean("notification_required").default(false),
  notificationsSent: jsonb("notifications_sent"), // Track regulatory notifications
  reportedToAuthorities: boolean("reported_to_authorities").default(false),
  reportedAt: timestamp("reported_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorAgreements = pgTable("vendor_agreements", {
  id: serial("id").primaryKey(),
  vendorName: varchar("vendor_name").notNull(),
  agreementType: varchar("agreement_type").notNull(), // BAA, DPA, service_agreement
  status: varchar("status").notNull().default("active"), // active, expired, terminated
  signedDate: timestamp("signed_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  renewalDate: timestamp("renewal_date"),
  dataProcessingActivities: text("data_processing_activities").array(),
  complianceFrameworks: text("compliance_frameworks").array(), // HIPAA, GDPR, SOC2
  contractDocument: text("contract_document_path"),
  keyContacts: jsonb("key_contacts"), // Contact information
  auditSchedule: varchar("audit_schedule"), // annual, biannual, quarterly
  lastAuditDate: timestamp("last_audit_date"),
  nextAuditDate: timestamp("next_audit_date"),
  riskAssessment: varchar("risk_assessment"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clinics: many(clinics),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(users, {
    fields: [clinics.ownerId],
    references: [users.id],
  }),
  appointments: many(appointments),
  callLogs: many(callLogs),
  aiConfiguration: one(aiConfigurations),
  apiConfiguration: one(apiConfigurations),
  fileExports: many(fileExports),
}));

export const appointmentsRelations = relations(appointments, ({ one }): any => ({
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
  call: one(callLogs, {
    fields: [appointments.callLogId],
    references: [callLogs.id],
  }),
}));

export const callLogsRelations = relations(callLogs, ({ one }): any => ({
  clinic: one(clinics, {
    fields: [callLogs.clinicId],
    references: [clinics.id],
  }),
  appointment: one(appointments, {
    fields: [callLogs.appointmentId],
    references: [appointments.id],
  }),
}));

export const aiConfigurationsRelations = relations(aiConfigurations, ({ one }) => ({
  clinic: one(clinics, {
    fields: [aiConfigurations.clinicId],
    references: [clinics.id],
  }),
}));

export const apiConfigurationsRelations = relations(apiConfigurations, ({ one }) => ({
  clinic: one(clinics, {
    fields: [apiConfigurations.clinicId],
    references: [clinics.id],
  }),
}));

export const fileExportsRelations = relations(fileExports, ({ one }) => ({
  clinic: one(clinics, {
    fields: [fileExports.clinicId],
    references: [clinics.id],
  }),
}));

// Organization membership table for multi-user RBAC
export const clinicMembers = pgTable("clinic_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  role: varchar("role").notNull().default("staff"), // owner, admin, manager, staff, viewer
  permissions: jsonb("permissions").default({
    canManageSettings: false,
    canManageTeam: false,
    canViewAnalytics: false,
    canMakeCalls: false,
    canViewCallLogs: false,
    canManageAppointments: false,
    canConfigureAI: false,
    canExportData: false
  }),
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Team invitations table
export const teamInvitations = pgTable("team_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  role: varchar("role").notNull().default("staff"),
  permissions: jsonb("permissions").default({
    canManageSettings: false,
    canManageTeam: false,
    canViewAnalytics: false,
    canMakeCalls: false,
    canViewCallLogs: false,
    canManageAppointments: false,
    canConfigureAI: false,
    canExportData: false
  }),
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage tracking table for quotas and billing
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  period: varchar("period").notNull(), // YYYY-MM format
  callsCount: integer("calls_count").notNull().default(0),
  callMinutes: integer("call_minutes").notNull().default(0),
  aiCharactersUsed: integer("ai_characters_used").notNull().default(0),
  appointmentsBooked: integer("appointments_booked").notNull().default(0),
  resetAt: timestamp("reset_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API Keys table for tenant-scoped API access
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  keyName: text("key_name").notNull(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull().unique(), // pk_live_1234567890ab
  hashedKey: text("hashed_key").notNull(), // bcrypt hash of full key
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`), // ['read:appointments', 'write:calls']
  environment: varchar("environment").notNull().default("live"), // live, test
  status: varchar("status").notNull().default("active"), // active, revoked, expired
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
});

// Webhooks table for event notifications
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  description: text("description"),
  events: text("events").array().notNull().default(sql`ARRAY[]::text[]`), // ['call.completed', 'appointment.created']
  secret: text("secret").notNull(), // For signature verification
  status: varchar("status").notNull().default("active"), // active, disabled, failed
  retryPolicy: jsonb("retry_policy").default(sql`'{"maxRetries": 3, "backoffMultiplier": 2}'::jsonb`),
  lastSuccessAt: timestamp("last_success_at"),
  lastFailureAt: timestamp("last_failure_at"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Webhook deliveries for tracking and debugging
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: uuid("webhook_id").references(() => webhooks.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status").notNull(), // pending, delivered, failed, retrying
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  responseHeaders: jsonb("response_headers"),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API usage metrics for rate limiting and analytics
export const apiUsage = pgTable("api_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  endpoint: varchar("endpoint").notNull(),
  method: varchar("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rate limiting buckets
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: varchar("id").primaryKey(), // Composite: clinicId:endpoint:window
  requestCount: integer("request_count").notNull().default(0),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Advanced Analytics & Reporting tables

// Cohort Analysis - Track user behavior over time
export const cohortAnalysis = pgTable("cohort_analysis", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  cohortPeriod: varchar("cohort_period").notNull(), // YYYY-MM format
  cohortSize: integer("cohort_size").notNull().default(0),
  retentionData: jsonb("retention_data").notNull(), // {week1: X, month1: Y, month3: Z, etc.}
  conversionData: jsonb("conversion_data").notNull(), // {trial_to_paid: X, activated: Y, etc.}
  revenueData: jsonb("revenue_data").notNull(), // {mrr: X, arr: Y, ltv: Z}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversion Events - Track key conversion points
export const conversionEvents = pgTable("conversion_events", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: varchar("event_type").notNull(), // signup, trial_start, paid_conversion, feature_adoption, etc.
  eventProperties: jsonb("event_properties"), // Additional event-specific data
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }), // Revenue value if applicable
  sessionId: varchar("session_id"),
  referrerSource: varchar("referrer_source"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  metadata: jsonb("metadata"), // Flexible field for additional tracking data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Call Outcome Metrics - Detailed call performance analytics
export const callOutcomeMetrics = pgTable("call_outcome_metrics", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  callLogId: uuid("call_log_id").references(() => callLogs.id, { onDelete: "cascade" }),
  callDuration: integer("call_duration"), // Duration in seconds
  callOutcome: varchar("call_outcome").notNull(), // completed, abandoned, transferred, voicemail, etc.
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 rating if available
  appointmentBooked: boolean("appointment_booked").default(false),
  appointmentDate: timestamp("appointment_date"),
  aiPerformanceScore: decimal("ai_performance_score", { precision: 3, scale: 2 }), // 0.00 to 5.00
  resolutionTime: integer("resolution_time"), // Time to resolve inquiry in seconds
  transferredToHuman: boolean("transferred_to_human").default(false),
  callTags: text("call_tags").array(), // Categorization tags
  sentiment: varchar("sentiment"), // positive, neutral, negative
  transcriptQuality: decimal("transcript_quality", { precision: 3, scale: 2 }), // Quality score 0-1
  costPerCall: decimal("cost_per_call", { precision: 8, scale: 4 }), // Cost in GBP
  revenueAttribution: decimal("revenue_attribution", { precision: 10, scale: 2 }), // Revenue generated from call
  followupRequired: boolean("followup_required").default(false),
  metadata: jsonb("metadata"), // Additional metrics data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Analytics Reports - Scheduled and on-demand reports
export const analyticsReports = pgTable("analytics_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }), // null for platform-wide reports
  reportName: varchar("report_name").notNull(),
  reportType: varchar("report_type").notNull(), // cohort, conversion, call_metrics, revenue, custom
  frequency: varchar("frequency").notNull(), // daily, weekly, monthly, quarterly, on_demand
  recipients: text("recipients").array(), // Email addresses to send report to
  reportConfig: jsonb("report_config").notNull(), // Report parameters and filters
  lastGenerated: timestamp("last_generated"),
  nextScheduled: timestamp("next_scheduled"),
  isActive: boolean("is_active").default(true),
  generationCount: integer("generation_count").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Report Deliveries - Track report generation and delivery
export const reportDeliveries = pgTable("report_deliveries", {
  id: serial("id").primaryKey(),
  reportId: uuid("report_id").notNull().references(() => analyticsReports.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  deliveryStatus: varchar("delivery_status").notNull(), // generating, completed, failed, sent
  reportData: jsonb("report_data"), // Generated report content
  fileUrl: varchar("file_url"), // URL to generated report file (PDF/Excel)
  deliveryMethod: varchar("delivery_method").notNull(), // email, download, api
  recipientEmail: varchar("recipient_email"),
  errorMessage: text("error_message"),
  generationTimeMs: integer("generation_time_ms"),
  fileSizeBytes: integer("file_size_bytes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Performance Benchmarks - Industry and comparative analytics
export const performanceBenchmarks = pgTable("performance_benchmarks", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }), // null for platform benchmarks
  benchmarkType: varchar("benchmark_type").notNull(), // industry, plan_tier, clinic_size, geographic
  benchmarkCategory: varchar("benchmark_category").notNull(), // call_metrics, conversion, retention, satisfaction
  metricName: varchar("metric_name").notNull(), // answer_rate, booking_conversion, avg_call_duration
  clinicValue: decimal("clinic_value", { precision: 10, scale: 4 }),
  benchmarkValue: decimal("benchmark_value", { precision: 10, scale: 4 }),
  percentileRank: integer("percentile_rank"), // 1-100 percentile ranking
  sampleSize: integer("sample_size"), // Number of clinics in benchmark
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }), // Statistical confidence
  trend: varchar("trend"), // improving, declining, stable
  period: varchar("period").notNull(), // YYYY-MM format
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for new tables
export const clinicMembersRelations = relations(clinicMembers, ({ one }) => ({
  user: one(users, {
    fields: [clinicMembers.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [clinicMembers.clinicId],
    references: [clinics.id],
  }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  clinic: one(clinics, {
    fields: [teamInvitations.clinicId],
    references: [clinics.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  clinic: one(clinics, {
    fields: [usageTracking.clinicId],
    references: [clinics.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  clinic: one(clinics, {
    fields: [apiKeys.clinicId],
    references: [clinics.id],
  }),
  createdBy: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [webhooks.clinicId],
    references: [clinics.id],
  }),
  createdBy: one(users, {
    fields: [webhooks.createdBy],
    references: [users.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  clinic: one(clinics, {
    fields: [apiUsage.clinicId],
    references: [clinics.id],
  }),
  apiKey: one(apiKeys, {
    fields: [apiUsage.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// Advanced Analytics Relations
export const cohortAnalysisRelations = relations(cohortAnalysis, ({ one }) => ({
  clinic: one(clinics, {
    fields: [cohortAnalysis.clinicId],
    references: [clinics.id],
  }),
}));

export const conversionEventsRelations = relations(conversionEvents, ({ one }) => ({
  clinic: one(clinics, {
    fields: [conversionEvents.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [conversionEvents.userId],
    references: [users.id],
  }),
}));

export const callOutcomeMetricsRelations = relations(callOutcomeMetrics, ({ one }) => ({
  clinic: one(clinics, {
    fields: [callOutcomeMetrics.clinicId],
    references: [clinics.id],
  }),
  callLog: one(callLogs, {
    fields: [callOutcomeMetrics.callLogId],
    references: [callLogs.id],
  }),
}));

export const analyticsReportsRelations = relations(analyticsReports, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [analyticsReports.clinicId],
    references: [clinics.id],
  }),
  createdBy: one(users, {
    fields: [analyticsReports.createdBy],
    references: [users.id],
  }),
  deliveries: many(reportDeliveries),
}));

export const reportDeliveriesRelations = relations(reportDeliveries, ({ one }) => ({
  report: one(analyticsReports, {
    fields: [reportDeliveries.reportId],
    references: [analyticsReports.id],
  }),
  clinic: one(clinics, {
    fields: [reportDeliveries.clinicId],
    references: [clinics.id],
  }),
}));

export const performanceBenchmarksRelations = relations(performanceBenchmarks, ({ one }) => ({
  clinic: one(clinics, {
    fields: [performanceBenchmarks.clinicId],
    references: [clinics.id],
  }),
}));

// Insert schemas for new tables
export const insertClinicMemberSchema = createInsertSchema(clinicMembers);
export const insertTeamInvitationSchema = createInsertSchema(teamInvitations);
export const insertUsageTrackingSchema = createInsertSchema(usageTracking);

// API-related insert schemas
export const insertApiKeySchema = createInsertSchema(apiKeys);
export const insertWebhookSchema = createInsertSchema(webhooks);
export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries);
export const insertApiUsageSchema = createInsertSchema(apiUsage);
export const insertRateLimitBucketSchema = createInsertSchema(rateLimitBuckets);

// Advanced Analytics insert schemas
export const insertCohortAnalysisSchema = createInsertSchema(cohortAnalysis);
export const insertConversionEventSchema = createInsertSchema(conversionEvents);
export const insertCallOutcomeMetricSchema = createInsertSchema(callOutcomeMetrics);
export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports);
export const insertReportDeliverySchema = createInsertSchema(reportDeliveries);
export const insertPerformanceBenchmarkSchema = createInsertSchema(performanceBenchmarks);

// Compliance schema exports
export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const insertDataRetentionPolicySchema = createInsertSchema(dataRetentionPolicies);
export const insertConsentRecordSchema = createInsertSchema(consentRecords);
export const insertDataBreachIncidentSchema = createInsertSchema(dataBreachIncidents);
export const insertVendorAgreementSchema = createInsertSchema(vendorAgreements);

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type FileExport = typeof fileExports.$inferSelect;
export type ClinicMember = typeof clinicMembers.$inferSelect;
export type InsertClinicMember = z.infer<typeof insertClinicMemberSchema>;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;

// API-related types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type InsertRateLimitBucket = z.infer<typeof insertRateLimitBucketSchema>;

// Advanced Analytics types
export type CohortAnalysis = typeof cohortAnalysis.$inferSelect;
export type InsertCohortAnalysis = z.infer<typeof insertCohortAnalysisSchema>;
export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;
export type CallOutcomeMetric = typeof callOutcomeMetrics.$inferSelect;
export type InsertCallOutcomeMetric = z.infer<typeof insertCallOutcomeMetricSchema>;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type ReportDelivery = typeof reportDeliveries.$inferSelect;
export type InsertReportDelivery = z.infer<typeof insertReportDeliverySchema>;
export type PerformanceBenchmark = typeof performanceBenchmarks.$inferSelect;
export type InsertPerformanceBenchmark = z.infer<typeof insertPerformanceBenchmarkSchema>;

// Compliance types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = z.infer<typeof insertDataRetentionPolicySchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type DataBreachIncident = typeof dataBreachIncidents.$inferSelect;
export type InsertDataBreachIncident = z.infer<typeof insertDataBreachIncidentSchema>;
export type VendorAgreement = typeof vendorAgreements.$inferSelect;
export type InsertVendorAgreement = z.infer<typeof insertVendorAgreementSchema>;
