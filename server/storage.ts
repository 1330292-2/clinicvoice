import {
  users,
  clinics,
  callLogs,
  appointments,
  aiConfigurations,
  clinicMembers,
  type User,
  type UpsertUser,
  type Clinic,
  type InsertClinic,
  type CallLog,
  type InsertCallLog,
  type Appointment,
  type InsertAppointment,
  type AiConfiguration,
  type InsertAiConfiguration,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Clinic operations
  getClinicByUserId(userId: string): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic>;
  
  // Call log operations
  getCallLogsByClinicId(clinicId: string): Promise<CallLog[]>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  getCallLogById(id: string): Promise<CallLog | undefined>;
  
  // Appointment operations
  getAppointmentsByClinicId(clinicId: string): Promise<Appointment[]>;
  getTodayAppointmentsByClinicId(clinicId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  
  // AI configuration operations
  getAiConfigurationByClinicId(clinicId: string): Promise<AiConfiguration | undefined>;
  createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration>;
  updateAiConfiguration(id: string, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Clinic operations
  async getClinicByUserId(userId: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.ownerId, userId));
    return clinic;
  }

  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    
    // Add the clinic owner to clinicMembers with full permissions
    await db.insert(clinicMembers).values({
      userId: clinic.ownerId,
      clinicId: newClinic.id,
      role: 'owner',
      permissions: {
        canManageSettings: true,
        canManageTeam: true,
        canViewAnalytics: true,
        canMakeCalls: true,
        canViewCallLogs: true,
        canManageAppointments: true,
        canConfigureAI: true,
        canExportData: true
      }
    });
    
    return newClinic;
  }

  async updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic> {
    const [updatedClinic] = await db
      .update(clinics)
      .set({ ...clinic, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return updatedClinic;
  }

  // Call log operations
  async getCallLogsByClinicId(clinicId: string): Promise<CallLog[]> {
    return await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.clinicId, clinicId))
      .orderBy(desc(callLogs.createdAt));
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const [newCallLog] = await db.insert(callLogs).values(callLog).returning();
    return newCallLog;
  }

  async getCallLogById(id: string): Promise<CallLog | undefined> {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.id, id));
    return callLog;
  }

  // Appointment operations
  async getAppointmentsByClinicId(clinicId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getTodayAppointmentsByClinicId(clinicId: string): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          // Note: For simplicity, we'll fetch all appointments and filter on frontend
          // In production, you'd want proper date filtering
        )
      )
      .orderBy(appointments.appointmentDate);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  // AI configuration operations
  async getAiConfigurationByClinicId(clinicId: string): Promise<AiConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.clinicId, clinicId));
    return config;
  }

  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const [newConfig] = await db.insert(aiConfigurations).values(config).returning();
    return newConfig;
  }

  async updateAiConfiguration(id: string, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration> {
    const [updatedConfig] = await db
      .update(aiConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(aiConfigurations.id, id))
      .returning();
    return updatedConfig;
  }
}

export const storage = new DatabaseStorage();
