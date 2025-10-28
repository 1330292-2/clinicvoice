import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "../db";
import { appointments, callLogs, fileExports, clinics } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { Appointment, CallLog, Clinic } from "@shared/schema";

export class FileExportService {
  private baseExportPath = "exports";

  constructor() {
    // Ensure export directory exists
    this.ensureExportDirectory();
  }

  private async ensureExportDirectory() {
    try {
      await mkdir(this.baseExportPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async exportAppointments(clinicId: string, format: "csv" | "json" = "csv", dateRange?: { start: Date; end: Date }) {
    // Fetch appointments for the clinic
    let query = db.select().from(appointments).where(eq(appointments.clinicId, clinicId));
    
    if (dateRange) {
      query = query.where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.appointmentDate, dateRange.start),
          lte(appointments.appointmentDate, dateRange.end)
        )
      );
    }

    const appointmentData = await query;
    
    if (appointmentData.length === 0) {
      throw new Error("No appointments found for the specified criteria");
    }

    const fileName = `appointments-${clinicId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = join(this.baseExportPath, fileName);

    let fileContent: string;
    
    if (format === "csv") {
      fileContent = this.convertAppointmentsToCSV(appointmentData);
    } else {
      fileContent = JSON.stringify(appointmentData, null, 2);
    }

    await writeFile(filePath, fileContent, 'utf8');

    // Record the export in the database
    await this.recordFileExport(clinicId, "appointments", fileName, filePath, format, appointmentData.length);

    // Update appointments as exported
    await db.update(appointments)
      .set({ exportedToFile: true, fileExportPath: filePath })
      .where(eq(appointments.clinicId, clinicId));

    return {
      fileName,
      filePath,
      recordCount: appointmentData.length,
      format
    };
  }

  async exportCallLogs(clinicId: string, format: "csv" | "json" = "csv", dateRange?: { start: Date; end: Date }) {
    let query = db.select().from(callLogs).where(eq(callLogs.clinicId, clinicId));
    
    if (dateRange) {
      query = query.where(
        and(
          eq(callLogs.clinicId, clinicId),
          gte(callLogs.createdAt, dateRange.start),
          lte(callLogs.createdAt, dateRange.end)
        )
      );
    }

    const callData = await query;
    
    if (callData.length === 0) {
      throw new Error("No call logs found for the specified criteria");
    }

    const fileName = `call-logs-${clinicId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = join(this.baseExportPath, fileName);

    let fileContent: string;
    
    if (format === "csv") {
      fileContent = this.convertCallLogsToCSV(callData);
    } else {
      fileContent = JSON.stringify(callData, null, 2);
    }

    await writeFile(filePath, fileContent, 'utf8');

    // Record the export in the database
    await this.recordFileExport(clinicId, "calls", fileName, filePath, format, callData.length);

    // Update call logs as exported
    await db.update(callLogs)
      .set({ exportedToFile: true, fileExportPath: filePath })
      .where(eq(callLogs.clinicId, clinicId));

    return {
      fileName,
      filePath,
      recordCount: callData.length,
      format
    };
  }

  async exportClinicAnalytics(clinicId: string, format: "csv" | "json" = "csv") {
    // Get clinic data with aggregated statistics
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic) {
      throw new Error("Clinic not found");
    }

    const [appointmentStats] = await db.select({
      totalAppointments: appointments.id,
      // Add more aggregated fields as needed
    }).from(appointments).where(eq(appointments.clinicId, clinicId));

    const [callStats] = await db.select({
      totalCalls: callLogs.id,
      // Add more aggregated fields as needed
    }).from(callLogs).where(eq(callLogs.clinicId, clinicId));

    const analyticsData = {
      clinic: {
        id: clinic.id,
        name: clinic.name,
        email: clinic.email,
        phoneNumber: clinic.phoneNumber,
        subscriptionTier: clinic.subscriptionTier,
        subscriptionStatus: clinic.subscriptionStatus,
        totalCalls: clinic.totalCalls,
        totalAppointments: clinic.totalAppointments,
        monthlyCallsUsed: clinic.monthlyCallsUsed,
        createdAt: clinic.createdAt,
      },
      statistics: {
        totalAppointments: appointmentStats?.totalAppointments || 0,
        totalCalls: callStats?.totalCalls || 0,
        // Add more analytics as needed
      },
      exportedAt: new Date().toISOString(),
    };

    const fileName = `analytics-${clinicId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = join(this.baseExportPath, fileName);

    let fileContent: string;
    
    if (format === "csv") {
      fileContent = this.convertAnalyticsToCSV(analyticsData);
    } else {
      fileContent = JSON.stringify(analyticsData, null, 2);
    }

    await writeFile(filePath, fileContent, 'utf8');

    // Record the export in the database
    await this.recordFileExport(clinicId, "analytics", fileName, filePath, format, 1);

    return {
      fileName,
      filePath,
      recordCount: 1,
      format
    };
  }

  private async recordFileExport(
    clinicId: string,
    exportType: string,
    fileName: string,
    filePath: string,
    format: string,
    recordCount: number
  ) {
    await db.insert(fileExports).values({
      clinicId,
      exportType,
      fileName,
      filePath,
      fileFormat: format,
      recordCount,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
  }

  private convertAppointmentsToCSV(appointments: Appointment[]): string {
    const headers = [
      "ID",
      "Patient Name",
      "Patient Phone",
      "Patient Email",
      "Appointment Date",
      "Appointment Type",
      "Duration (mins)",
      "Status",
      "Price",
      "Is Paid",
      "Notes",
      "Created At"
    ];

    const rows = appointments.map(apt => [
      apt.id,
      apt.patientName,
      apt.patientPhone || "",
      apt.patientEmail || "",
      apt.appointmentDate.toISOString(),
      apt.appointmentType || "",
      apt.duration || "30",
      apt.status || "scheduled",
      apt.price || "0",
      apt.isPaid ? "Yes" : "No",
      (apt.notes || "").replace(/"/g, '""'), // Escape quotes for CSV
      apt.createdAt.toISOString()
    ]);

    return [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  private convertCallLogsToCSV(callLogs: CallLog[]): string {
    const headers = [
      "ID",
      "Twilio Call SID",
      "Caller Phone",
      "To Number",
      "Call Type",
      "Duration (seconds)",
      "Call Status",
      "Sentiment Score",
      "Appointment Booked",
      "Cost",
      "Summary",
      "Created At"
    ];

    const rows = callLogs.map(call => [
      call.id,
      call.twilioCallSid || "",
      call.callerPhone,
      call.toNumber || "",
      call.callType || "inbound",
      call.duration || "0",
      call.callStatus || "completed",
      call.sentimentScore || "0",
      call.appointmentBooked ? "Yes" : "No",
      call.cost || "0",
      (call.summary || "").replace(/"/g, '""'), // Escape quotes for CSV
      call.createdAt.toISOString()
    ]);

    return [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  private convertAnalyticsToCSV(data: any): string {
    const headers = [
      "Metric",
      "Value"
    ];

    const rows = [
      ["Clinic Name", data.clinic.name],
      ["Clinic Email", data.clinic.email],
      ["Phone Number", data.clinic.phoneNumber || ""],
      ["Subscription Tier", data.clinic.subscriptionTier],
      ["Subscription Status", data.clinic.subscriptionStatus],
      ["Total Calls", data.clinic.totalCalls.toString()],
      ["Total Appointments", data.clinic.totalAppointments.toString()],
      ["Monthly Calls Used", data.clinic.monthlyCallsUsed.toString()],
      ["Created At", data.clinic.createdAt],
      ["Exported At", data.exportedAt]
    ];

    return [headers.join(","), ...rows.map(row => `"${row[0]}","${row[1]}"`)].join("\n");
  }

  async getFileExports(clinicId: string) {
    return await db.select().from(fileExports)
      .where(eq(fileExports.clinicId, clinicId))
      .orderBy(fileExports.createdAt);
  }

  async deleteExpiredExports() {
    const now = new Date();
    const expiredExports = await db.select().from(fileExports)
      .where(lte(fileExports.expiresAt, now));

    // Delete files from filesystem and database records
    for (const exportRecord of expiredExports) {
      try {
        await import('fs/promises').then(fs => fs.unlink(exportRecord.filePath));
      } catch (error) {
        console.error(`Failed to delete file ${exportRecord.filePath}:`, error);
      }
    }

    await db.delete(fileExports).where(lte(fileExports.expiresAt, now));
    
    return expiredExports.length;
  }
}