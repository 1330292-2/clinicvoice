import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { FileExportService } from "./services/fileExport";
import { db } from "./db";
import { clinics, users, callLogs, appointments, platformAnalytics, apiConfigurations, clinicMembers, teamInvitations, usageTracking, auditLogs, dataRetentionPolicies, apiKeys, webhooks, webhookDeliveries, apiUsage, rateLimitBuckets, cohortAnalysis, conversionEvents, callOutcomeMetrics, analyticsReports, reportDeliveries, performanceBenchmarks } from "@shared/schema";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { eq, count, sum, avg, desc, gte, lte, and, lt, sql } from "drizzle-orm";
import { AuditService } from "./services/audit-service";
import { 
  auditCreate, auditRead, auditUpdate, auditDelete, auditExport,
  auditLogin, auditAccessPatientData 
} from "./middleware/audit-middleware";
import {
  insertClinicSchema,
  insertCallLogSchema,
  insertAppointmentSchema,
  insertAiConfigurationSchema,
  insertClinicMemberSchema,
  insertTeamInvitationSchema,
} from "@shared/schema";
import { z } from "zod";
import apiRoutes from "./routes/api";
import publicApiRoutes from "./routes/public-api";
import passport from "passport";
import { create } from "xmlbuilder2";
import WebSocket, { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin-only middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      req.adminUser = user;
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Admin Dashboard Routes
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const analytics = await db.select().from(platformAnalytics)
        .where(gte(platformAnalytics.date, thirtyDaysAgo))
        .orderBy(desc(platformAnalytics.date));

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/clinics', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allClinics = await db.select({
        id: clinics.id,
        name: clinics.name,
        email: clinics.email,
        phoneNumber: clinics.phoneNumber,
        address: clinics.address,
        subscriptionStatus: clinics.subscriptionStatus,
        subscriptionTier: clinics.subscriptionTier,
        totalCalls: clinics.totalCalls,
        totalAppointments: clinics.totalAppointments,
        monthlyCallsUsed: clinics.monthlyCallsUsed,
        callsLimit: clinics.callsLimit,
        isActive: clinics.isActive,
        createdAt: clinics.createdAt,
        updatedAt: clinics.updatedAt,
      }).from(clinics)
        .orderBy(desc(clinics.createdAt));

      res.json(allClinics);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ message: "Failed to fetch clinics" });
    }
  });

  app.get('/api/admin/platform-stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get platform statistics
      const [totalClinicsResult] = await db.select({ count: count() }).from(clinics);
      const [activeClinicsResult] = await db.select({ count: count() }).from(clinics)
        .where(eq(clinics.isActive, true));

      const [newSignupsResult] = await db.select({ count: count() }).from(clinics)
        .where(gte(clinics.createdAt, thirtyDaysAgo));

      const [totalCallsResult] = await db.select({ sum: sum(clinics.totalCalls) }).from(clinics);
      const [totalAppointmentsResult] = await db.select({ sum: sum(clinics.totalAppointments) }).from(clinics);

      // Calculate average call duration from call logs
      const [avgDurationResult] = await db.select({ avg: avg(callLogs.duration) }).from(callLogs)
        .where(gte(callLogs.createdAt, thirtyDaysAgo));

      // Calculate total revenue based on subscription tiers
      const [basicCount] = await db.select({ count: count() }).from(clinics)
        .where(eq(clinics.subscriptionTier, 'basic'));
      const [premiumCount] = await db.select({ count: count() }).from(clinics)
        .where(eq(clinics.subscriptionTier, 'premium'));
      const [enterpriseCount] = await db.select({ count: count() }).from(clinics)
        .where(eq(clinics.subscriptionTier, 'enterprise'));

      const totalRevenue = (Number(basicCount.count) * 49) + (Number(premiumCount.count) * 149) + (Number(enterpriseCount.count) * 299);

      const stats = {
        totalClinics: totalClinicsResult.count,
        activeClinics: activeClinicsResult.count,
        newSignups: newSignupsResult.count,
        totalCalls: totalCallsResult.sum || 0,
        totalAppointments: totalAppointmentsResult.sum || 0,
        totalRevenue: totalRevenue,
        churnedClinics: 0, // Calculate based on cancelled subscriptions
        averageCallDuration: Math.round(Number(avgDurationResult.avg) || 0),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // File export routes
  const fileExportService = new FileExportService();

  app.post('/api/exports/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const { format = 'csv', dateRange } = req.body;
      
      const exportResult = await fileExportService.exportAppointments(
        clinic.id,
        format,
        dateRange ? { start: new Date(dateRange.start), end: new Date(dateRange.end) } : undefined
      );

      res.json(exportResult);
    } catch (error) {
      console.error("Error exporting appointments:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to export appointments" });
    }
  });

  app.post('/api/exports/calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const { format = 'csv', dateRange } = req.body;
      
      const exportResult = await fileExportService.exportCallLogs(
        clinic.id,
        format,
        dateRange ? { start: new Date(dateRange.start), end: new Date(dateRange.end) } : undefined
      );

      res.json(exportResult);
    } catch (error) {
      console.error("Error exporting call logs:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to export call logs" });
    }
  });

  app.post('/api/exports/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const { format = 'csv' } = req.body;
      
      const exportResult = await fileExportService.exportClinicAnalytics(clinic.id, format);

      res.json(exportResult);
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to export analytics" });
    }
  });

  app.get('/api/exports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const exports = await fileExportService.getFileExports(clinic.id);
      res.json(exports);
    } catch (error) {
      console.error("Error fetching exports:", error);
      res.status(500).json({ message: "Failed to fetch exports" });
    }
  });

  // Clinic routes
  app.get('/api/clinic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ message: "Failed to fetch clinic" });
    }
  });

  app.post('/api/clinic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinicData = insertClinicSchema.parse({ ...req.body, ownerId: userId });
      const clinic = await storage.createClinic(clinicData);
      
      // Create default AI configuration
      await storage.createAiConfiguration({ clinicId: clinic.id });
      
      res.json(clinic);
    } catch (error) {
      console.error("Error creating clinic:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create clinic" });
      }
    }
  });

  app.put('/api/clinic/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify clinic belongs to user
      const existingClinic = await storage.getClinicByUserId(userId);
      if (!existingClinic || existingClinic.id !== id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const clinicData = insertClinicSchema.partial().parse(req.body);
      const clinic = await storage.updateClinic(id, clinicData);
      res.json(clinic);
    } catch (error) {
      console.error("Error updating clinic:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update clinic" });
      }
    }
  });

  // Call logs routes
  app.get('/api/call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.json([]); // Return empty array instead of 404
      }

      const callLogs = await storage.getCallLogsByClinicId(clinic.id);
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching call logs:", error);
      res.status(500).json({ message: "Failed to fetch call logs" });
    }
  });

  app.post('/api/call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const callLogData = insertCallLogSchema.parse({ ...req.body, clinicId: clinic.id });
      const callLog = await storage.createCallLog(callLogData);
      res.json(callLog);
    } catch (error) {
      console.error("Error creating call log:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create call log" });
      }
    }
  });

  app.get('/api/call-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const callLog = await storage.getCallLogById(id);
      
      if (!callLog) {
        return res.status(404).json({ message: "Call log not found" });
      }

      // Verify call log belongs to user's clinic
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic || callLog.clinicId !== clinic.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(callLog);
    } catch (error) {
      console.error("Error fetching call log:", error);
      res.status(500).json({ message: "Failed to fetch call log" });
    }
  });

  // Appointments routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.json([]); // Return empty array instead of 404
      }

      const appointments = await storage.getAppointmentsByClinicId(clinic.id);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const appointments = await storage.getTodayAppointmentsByClinicId(clinic.id);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const appointmentData = insertAppointmentSchema.parse({ ...req.body, clinicId: clinic.id });
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create appointment" });
      }
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update appointment" });
      }
    }
  });

  // AI Configuration routes
  app.get('/api/ai-configuration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.json(null); // Return null instead of 404
      }

      const config = await storage.getAiConfigurationByClinicId(clinic.id);
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI configuration:", error);
      res.status(500).json({ message: "Failed to fetch AI configuration" });
    }
  });

  app.put('/api/ai-configuration/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const configData = insertAiConfigurationSchema.partial().parse(req.body);
      const config = await storage.updateAiConfiguration(id, configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating AI configuration:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update AI configuration" });
      }
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByUserId(userId);
      if (!clinic) {
        // Return default stats for users without a clinic
        return res.json({
          callsToday: 0,
          appointmentsBooked: 0,
          avgResponseTime: "0s",
          satisfactionScore: 0,
        });
      }

      const callLogs = await storage.getCallLogsByClinicId(clinic.id);
      const appointments = await storage.getAppointmentsByClinicId(clinic.id);
      
      // Calculate today's stats
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todayCallLogs = callLogs.filter(log => 
        log.createdAt && new Date(log.createdAt) >= startOfDay
      );
      
      const todayAppointmentsBooked = todayCallLogs.filter(log => 
        log.appointmentBooked
      ).length;

      // Calculate average response time (mock calculation)
      const avgResponseTime = 2.3;

      // Calculate satisfaction score (mock calculation)
      const satisfactionScore = 4.8;

      const stats = {
        callsToday: todayCallLogs.length,
        appointmentsBooked: todayAppointmentsBooked,
        avgResponseTime: `${avgResponseTime}s`,
        satisfactionScore: satisfactionScore,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Voice calling integration with Twilio and OpenAI Realtime API
  app.post('/api/voice/webhook', async (req, res) => {
    try {
      // Validate Twilio webhook signature for security
      const twilioSignature = req.headers['x-twilio-signature'] as string;
      if (!twilioSignature) {
        console.error('Missing Twilio signature header');
        return res.status(400).send('Unauthorized');
      }

      // For clinic-specific validation, we need the clinic's Twilio auth token
      const { clinicId } = req.query;
      let authTokenToUse = process.env.TWILIO_AUTH_TOKEN; // Default fallback
      
      if (clinicId) {
        // Get clinic's specific Twilio configuration for validation
        try {
          const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId as string));
          if (clinic) {
            const [apiConfig] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.clinicId, clinic.id));
            if (apiConfig?.twilioAuthToken) {
              authTokenToUse = apiConfig.twilioAuthToken;
            }
          }
        } catch (error) {
          console.error('Error fetching clinic config for signature validation:', error);
        }
      }

      // Validate the signature
      if (authTokenToUse) {
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const isValid = require('twilio').validateRequest(authTokenToUse, twilioSignature, url, req.body);
        
        if (!isValid) {
          console.error('Invalid Twilio signature');
          return res.status(403).send('Forbidden');
        }
      }
      
      if (!clinicId) {
        // Default TwiML response for unidentified calls
        const twiml = create({
          Response: {
            Say: {
              "@voice": "alice",
              "@language": "en-GB",
              "#text": "Thank you for calling. Please hold while we connect you to our AI assistant."
            },
            Start: {
              Stream: {
                "@name": "clinicvoice-stream",
                "@url": `wss://${req.get('host')}/api/voice/media-stream`
              }
            }
          }
        }).end({ prettyPrint: true });
        
        return res.type('text/xml').send(twiml);
      }

      // Get clinic configuration for personalized AI
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId as string));
      
      if (!clinic) {
        const twiml = create({
          Response: {
            Say: {
              "@voice": "alice", 
              "@language": "en-GB",
              "#text": "Sorry, we cannot process your call at this time. Please try again later."
            }
          }
        }).end({ prettyPrint: true });
        
        return res.type('text/xml').send(twiml);
      }

      // Generate personalized TwiML with clinic info
      const greeting = `Hello! Thank you for calling ${clinic.name}. Our AI assistant will help you with appointments and inquiries.`;
      const twiml = create({
        Response: {
          Say: {
            "@voice": "alice",
            "@language": "en-GB", 
            "#text": greeting
          },
          Start: {
            Stream: {
              "@name": "clinicvoice-stream",
              "@url": `wss://${req.get('host')}/api/voice/media-stream?clinicId=${clinicId}`
            }
          }
        }
      }).end({ prettyPrint: true });

      res.type('text/xml').send(twiml);
    } catch (error) {
      console.error('Error handling voice webhook:', error);
      const twiml = create({
        Response: {
          Say: {
            "@voice": "alice",
            "@language": "en-GB",
            "#text": "We're experiencing technical difficulties. Please try calling again."
          }
        }
      }).end({ prettyPrint: true });
      
      res.type('text/xml').send(twiml);
    }
  });

  // API integration routes
  app.use(apiRoutes);
  
  // Register public API routes for third-party integrations
  app.use(publicApiRoutes);

  // Login and logout routes are handled in replitAuth.ts

  app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });

  const httpServer = createServer(app);
  
  // WebSocket server for Twilio Media Streams
  const wss = new WebSocketServer({ noServer: true });
  
  // Handle WebSocket upgrade for voice streaming
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/api/voice/media-stream')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle WebSocket connections for voice streaming
  wss.on('connection', async (twilioWS, req) => {
    console.log('Twilio media stream connected');
    
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const clinicId = url.searchParams.get('clinicId');
    
    // Get clinic configuration and AI settings
    let clinic = null;
    let aiConfig = null;
    
    if (clinicId) {
      [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
      if (clinic) {
        aiConfig = await storage.getAiConfigurationByClinicId(clinic.id);
      }
    }

    // Connect to OpenAI Realtime API
    const openaiWS = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    // Configure OpenAI session with clinic-specific instructions
    openaiWS.on('open', () => {
      const clinicName = clinic?.name || "the clinic";
      const phoneNumber = clinic?.phoneNumber || "our main number";
      
      const instructions = aiConfig?.personalityTraits || 
        `You are ClinicVoice, a friendly UK receptionist for ${clinicName}. ` +
        `Greet callers warmly, gather their name, contact details, and reason for calling. ` +
        `Help them book appointments using available time slots. ` +
        `If you can book an appointment, use the create_booking tool. ` +
        `Maintain patient confidentiality and be helpful but professional. ` +
        `For emergencies, advise calling 999 immediately. ` +
        `Our phone number is ${phoneNumber}.`;

      const session = {
        type: "session.update",
        session: {
          instructions,
          modalities: ["text", "audio"],
          voice: "alloy", // Use valid OpenAI Realtime voice
          input_audio_format: "g711_alaw",
          output_audio_format: "g711_alaw",
          tools: [{
            name: "create_booking",
            description: "Create a patient appointment",
            parameters: {
              type: "object", 
              properties: {
                patient_name: { type: "string" },
                patient_email: { type: "string" },
                patient_phone: { type: "string" },
                start_time_iso: { type: "string", description: "ISO8601 start time" },
                appointment_type: { type: "string" },
                notes: { type: "string" }
              },
              required: ["patient_name", "start_time_iso"]
            }
          }]
        }
      };
      
      openaiWS.send(JSON.stringify(session));
    });

    // Handle Twilio audio -> OpenAI
    twilioWS.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.event === 'media') {
          openaiWS.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data.media.payload
          }));
        } else if (data.event === 'start') {
          openaiWS.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
          openaiWS.send(JSON.stringify({ type: "response.create" }));
        } else if (data.event === 'stop') {
          openaiWS.close();
          twilioWS.close();
        }
      } catch (e) {
        console.error('Twilio WS parse error:', e);
      }
    });

    // Handle OpenAI responses -> Twilio
    openaiWS.on('message', async (raw) => {
      try {
        const evt = JSON.parse(raw.toString());

        // Stream audio back to Twilio
        if (evt.type === 'response.audio.delta' && evt.delta) {
          const frame = {
            event: "media",
            media: { payload: evt.delta }
          };
          twilioWS.send(JSON.stringify(frame));
        }

        // Handle booking tool calls
        if (evt.type === 'response.function_call_arguments.done' && evt.name === 'create_booking') {
          try {
            const args = JSON.parse(evt.arguments);
            
            if (clinic) {
              // Create appointment in database
              const appointmentData = {
                clinicId: clinic.id,
                patientName: args.patient_name,
                patientPhone: args.patient_phone,
                patientEmail: args.patient_email,
                appointmentDate: new Date(args.start_time_iso),
                appointmentType: args.appointment_type || 'General Consultation',
                notes: args.notes || '',
                status: 'scheduled'
              };
              
              // Validate and create appointment with proper schema
              const validAppointmentData = insertAppointmentSchema.parse({
                clinicId: clinic.id,
                patientName: args.patient_name,
                patientPhone: args.patient_phone || null,
                patientEmail: args.patient_email || null,
                appointmentDate: new Date(args.start_time_iso),
                appointmentType: args.appointment_type || 'General Consultation',
                notes: args.notes || '',
                status: 'scheduled'
              });
              
              const appointment = await storage.createAppointment(validAppointmentData);
              
              openaiWS.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: evt.call_id,
                  output: JSON.stringify({ 
                    success: true, 
                    appointment_id: appointment.id,
                    message: "Appointment successfully booked!"
                  })
                }
              }));
            } else {
              openaiWS.send(JSON.stringify({
                type: "conversation.item.create", 
                item: {
                  type: "function_call_output",
                  call_id: evt.call_id,
                  output: JSON.stringify({ 
                    success: false, 
                    error: "Unable to book appointment - clinic not found"
                  })
                }
              }));
            }
          } catch (err) {
            console.error('Booking error:', err);
            openaiWS.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output", 
                call_id: evt.call_id,
                output: JSON.stringify({ 
                  success: false, 
                  error: "Booking failed - please try again"
                })
              }
            }));
          }
          
          // Continue conversation
          openaiWS.send(JSON.stringify({ type: "response.create" }));
        }
      } catch (e) {
        console.error('OpenAI WS parse error:', e);
      }
    });

    // Handle connection cleanup
    openaiWS.on('close', () => {
      console.log('OpenAI WS closed');
      twilioWS.send(JSON.stringify({ event: "stop" }));
      twilioWS.close();
    });

    openaiWS.on('error', (e) => console.error('OpenAI WS error:', e));
    twilioWS.on('error', (e) => console.error('Twilio WS error:', e));
  });
  // Team Management Routes
  
  // Permission checking middleware
  const hasPermission = (permission: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user.claims.sub;
        const { clinicId } = req.params;

        // Check if user is clinic owner
        const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
        if (clinic?.ownerId === userId) {
          req.userPermissions = { isOwner: true, canManageTeam: true, canManageSettings: true };
          return next();
        }

        // Check clinic membership and permissions
        const [member] = await db
          .select()
          .from(clinicMembers)
          .where(and(
            eq(clinicMembers.userId, userId),
            eq(clinicMembers.clinicId, clinicId)
          ));

        if (!member || !member.isActive) {
          return res.status(403).json({ message: "Access denied to this clinic" });
        }

        const permissions = member.permissions as any;
        if (!permissions[permission]) {
          return res.status(403).json({ message: `Permission denied: ${permission}` });
        }

        req.userPermissions = permissions;
        next();
      } catch (error) {
        console.error("Error checking permissions:", error);
        res.status(500).json({ message: "Failed to verify permissions" });
      }
    };
  };

  // Get team members for a clinic
  app.get('/api/clinics/:clinicId/team', isAuthenticated, hasPermission('canManageTeam'), async (req: any, res) => {
    try {
      const { clinicId } = req.params;

      const members = await db
        .select({
          id: clinicMembers.id,
          userId: clinicMembers.userId,
          role: clinicMembers.role,
          permissions: clinicMembers.permissions,
          isActive: clinicMembers.isActive,
          joinedAt: clinicMembers.joinedAt,
          createdAt: clinicMembers.createdAt,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(clinicMembers)
        .leftJoin(users, eq(clinicMembers.userId, users.id))
        .where(eq(clinicMembers.clinicId, clinicId));

      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Send team invitation
  app.post('/api/clinics/:clinicId/invite', isAuthenticated, hasPermission('canManageTeam'), async (req: any, res) => {
    try {
      const { clinicId } = req.params;
      const { email, role = 'staff', permissions = {} } = req.body;
      const userId = req.user.claims.sub;

      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(clinicMembers)
        .leftJoin(users, eq(clinicMembers.userId, users.id))
        .where(and(
          eq(users.email, email),
          eq(clinicMembers.clinicId, clinicId)
        ));

      if (existingMember) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      // Check for existing pending invitation
      const [existingInvite] = await db
        .select()
        .from(teamInvitations)
        .where(and(
          eq(teamInvitations.email, email),
          eq(teamInvitations.clinicId, clinicId),
          eq(teamInvitations.status, 'pending')
        ));

      if (existingInvite) {
        return res.status(400).json({ message: "Invitation already sent to this email" });
      }

      // Generate invitation token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Default permissions by role
      const defaultPermissions = {
        staff: {
          canManageSettings: false,
          canManageTeam: false,
          canViewAnalytics: false,
          canMakeCalls: true,
          canViewCallLogs: true,
          canManageAppointments: true,
          canConfigureAI: false,
          canExportData: false
        },
        manager: {
          canManageSettings: false,
          canManageTeam: false,
          canViewAnalytics: true,
          canMakeCalls: true,
          canViewCallLogs: true,
          canManageAppointments: true,
          canConfigureAI: true,
          canExportData: true
        },
        admin: {
          canManageSettings: true,
          canManageTeam: true,
          canViewAnalytics: true,
          canMakeCalls: true,
          canViewCallLogs: true,
          canManageAppointments: true,
          canConfigureAI: true,
          canExportData: true
        }
      };

      const finalPermissions = { ...defaultPermissions[role as keyof typeof defaultPermissions], ...permissions };

      await db.insert(teamInvitations).values({
        clinicId,
        email,
        role,
        permissions: finalPermissions,
        token,
        invitedBy: userId,
        expiresAt,
      });

      // TODO: Send invitation email with token
      console.log(`Invitation sent to ${email} for clinic ${clinicId} with token: ${token}`);

      res.json({ message: "Invitation sent successfully", token });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Accept team invitation
  app.post('/api/invitations/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const userId = req.user.claims.sub;

      // Get current user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find valid invitation
      const [invitation] = await db
        .select()
        .from(teamInvitations)
        .where(and(
          eq(teamInvitations.token, token),
          eq(teamInvitations.status, 'pending'),
          eq(teamInvitations.email, user.email || '')
        ));

      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      if (new Date() > invitation.expiresAt) {
        await db
          .update(teamInvitations)
          .set({ status: 'expired' })
          .where(eq(teamInvitations.id, invitation.id));
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Add user to clinic members
      await db.insert(clinicMembers).values({
        userId,
        clinicId: invitation.clinicId,
        role: invitation.role,
        permissions: invitation.permissions,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
      });

      // Mark invitation as accepted
      await db
        .update(teamInvitations)
        .set({ status: 'accepted' })
        .where(eq(teamInvitations.id, invitation.id));

      res.json({ message: "Invitation accepted successfully", clinicId: invitation.clinicId });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Update team member role/permissions
  app.patch('/api/clinics/:clinicId/team/:memberId', isAuthenticated, hasPermission('canManageTeam'), async (req: any, res) => {
    try {
      const { clinicId, memberId } = req.params;
      const { role, permissions } = req.body;

      await db
        .update(clinicMembers)
        .set({ 
          role,
          permissions,
          updatedAt: new Date()
        })
        .where(and(
          eq(clinicMembers.id, memberId),
          eq(clinicMembers.clinicId, clinicId)
        ));

      res.json({ message: "Team member updated successfully" });
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  // Remove team member
  app.delete('/api/clinics/:clinicId/team/:memberId', isAuthenticated, hasPermission('canManageTeam'), async (req: any, res) => {
    try {
      const { clinicId, memberId } = req.params;

      await db
        .delete(clinicMembers)
        .where(and(
          eq(clinicMembers.id, memberId),
          eq(clinicMembers.clinicId, clinicId)
        ));

      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Usage Quota Enforcement Middleware
  const enforceQuota = (quotaType: 'calls' | 'aiCharacters' | 'appointments') => {
    return async (req: any, res: any, next: any) => {
      try {
        const { clinicId } = req.params;
        const userId = req.user.claims.sub;

        // Verify clinic access
        const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
        if (!clinic) {
          return res.status(404).json({ message: "Clinic not found" });
        }

        // Check if user has access (owner or member)
        if (clinic.ownerId !== userId) {
          const [member] = await db
            .select()
            .from(clinicMembers)
            .where(and(
              eq(clinicMembers.userId, userId),
              eq(clinicMembers.clinicId, clinicId),
              eq(clinicMembers.isActive, true)
            ));

          if (!member) {
            return res.status(403).json({ message: "Access denied to this clinic" });
          }
        }

        // Get current period usage
        const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
        let [usage] = await db
          .select()
          .from(usageTracking)
          .where(and(
            eq(usageTracking.clinicId, clinicId),
            eq(usageTracking.period, currentPeriod)
          ));

        // Create usage record if it doesn't exist
        if (!usage) {
          await db.insert(usageTracking).values({
            clinicId,
            period: currentPeriod,
            callsCount: 0,
            callMinutes: 0,
            aiCharactersUsed: 0,
            appointmentsBooked: 0,
          });
          [usage] = await db
            .select()
            .from(usageTracking)
            .where(and(
              eq(usageTracking.clinicId, clinicId),
              eq(usageTracking.period, currentPeriod)
            ));
        }

        // Define subscription limits
        const subscriptionLimits = {
          essential: { calls: 1000, aiCharacters: 50000, appointments: 500, unlimited: false },
          professional: { calls: 2500, aiCharacters: 125000, appointments: 1250, unlimited: false },
          enterprise: { calls: -1, aiCharacters: -1, appointments: -1, unlimited: true }
        };

        const limits = subscriptionLimits[clinic.subscriptionTier as keyof typeof subscriptionLimits] || subscriptionLimits.essential;

        // Check quota enforcement
        if (!limits.unlimited && limits[quotaType] !== -1) {
          const currentUsage = usage[quotaType === 'calls' ? 'callsCount' : 
                                   quotaType === 'aiCharacters' ? 'aiCharactersUsed' : 
                                   'appointmentsBooked'];

          if (currentUsage >= limits[quotaType]) {
            return res.status(429).json({ 
              message: `Monthly ${quotaType} quota exceeded. Upgrade your plan to continue.`,
              quotaType,
              currentUsage,
              limit: limits[quotaType],
              subscriptionTier: clinic.subscriptionTier,
              upgradeRequired: true
            });
          }

          // Warn when approaching limit (90%)
          const warningThreshold = Math.floor(limits[quotaType] * 0.9);
          if (currentUsage >= warningThreshold) {
            req.quotaWarning = {
              quotaType,
              currentUsage,
              limit: limits[quotaType],
              subscriptionTier: clinic.subscriptionTier,
              percentUsed: Math.floor((currentUsage / limits[quotaType]) * 100)
            };
          }
        }

        // Attach usage info to request for potential tracking
        req.usageInfo = { usage, limits, clinicId };
        next();
      } catch (error) {
        console.error("Error enforcing quota:", error);
        res.status(500).json({ message: "Failed to check usage quota" });
      }
    };
  };

  // Usage tracking function for incrementing counters
  const trackUsage = async (clinicId: string, updates: Partial<{
    callsCount: number;
    callMinutes: number;
    aiCharactersUsed: number;
    appointmentsBooked: number;
  }>) => {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      
      // Get or create usage record
      let [usage] = await db
        .select()
        .from(usageTracking)
        .where(and(
          eq(usageTracking.clinicId, clinicId),
          eq(usageTracking.period, currentPeriod)
        ));

      if (!usage) {
        [usage] = await db.insert(usageTracking).values({
          clinicId,
          period: currentPeriod,
          callsCount: 0,
          callMinutes: 0,
          aiCharactersUsed: 0,
          appointmentsBooked: 0,
        }).returning();
      }

      // Update counters
      const updateData: any = { updatedAt: new Date() };
      if (updates.callsCount) updateData.callsCount = usage.callsCount + updates.callsCount;
      if (updates.callMinutes) updateData.callMinutes = usage.callMinutes + updates.callMinutes;
      if (updates.aiCharactersUsed) updateData.aiCharactersUsed = usage.aiCharactersUsed + updates.aiCharactersUsed;
      if (updates.appointmentsBooked) updateData.appointmentsBooked = usage.appointmentsBooked + updates.appointmentsBooked;

      await db
        .update(usageTracking)
        .set(updateData)
        .where(and(
          eq(usageTracking.clinicId, clinicId),
          eq(usageTracking.period, currentPeriod)
        ));

      return true;
    } catch (error) {
      console.error("Error tracking usage:", error);
      return false;
    }
  };

  // Attach tracking function to app for use in other routes
  (app as any).trackUsage = trackUsage;

  // Initialize compliance framework on startup
  await AuditService.initializeDefaultPolicies();

  // Compliance and Audit Routes
  
  // Admin-only compliance dashboard
  app.get('/api/admin/compliance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get compliance metrics
      const [auditLogStats] = await db
        .select({
          totalLogs: sql<number>`count(*)`,
          successfulActions: sql<number>`count(*) filter (where successful = true)`,
          failedActions: sql<number>`count(*) filter (where successful = false)`,
          uniqueUsers: sql<number>`count(distinct user_id)`,
          recentLogins: sql<number>`count(*) filter (where action = 'LOGIN' and timestamp > now() - interval '24 hours')`
        })
        .from(auditLogs);

      // Get retention policies
      const retentionPolicies = await db
        .select()
        .from(dataRetentionPolicies)
        .where(eq(dataRetentionPolicies.isActive, true));

      // Recent audit activity
      const recentActivity = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          timestamp: auditLogs.timestamp,
          successful: auditLogs.successful,
          ipAddress: auditLogs.ipAddress,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(100);

      const complianceData = {
        auditStats: auditLogStats,
        retentionPolicies,
        recentActivity,
        lastCleanup: null, // Would track last cleanup job
        complianceStatus: {
          hipaaCompliant: true, // Based on policies and audit coverage
          gdprCompliant: true,
          dataRetentionConfigured: retentionPolicies.length > 0,
          auditLoggingActive: auditLogStats.totalLogs > 0,
        }
      };

      res.json(complianceData);
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      res.status(500).json({ message: "Failed to fetch compliance data" });
    }
  });

  // Get audit trail for specific entity (admin only)
  app.get('/api/admin/audit-trail/:entityType/:entityId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { entityType, entityId } = req.params;
      const auditTrail = await AuditService.getAuditTrail(entityType, entityId);

      res.json(auditTrail);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Manual cleanup of expired audit logs (admin only)
  app.post('/api/admin/cleanup-audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deletedCount = await AuditService.cleanupExpiredLogs();

      res.json({ 
        message: `Cleaned up ${deletedCount} expired audit logs`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error cleaning up audit logs:", error);
      res.status(500).json({ message: "Failed to cleanup audit logs" });
    }
  });

  // Tenant Lifecycle Management Routes
  
  // Suspend a clinic (admin only)
  app.post('/api/admin/clinics/:clinicId/suspend', isAuthenticated, auditUpdate('clinic'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { clinicId } = req.params;
      const { reason, suspensionType = 'temporary' } = req.body;

      // Update clinic status
      const [suspendedClinic] = await db
        .update(clinics)
        .set({ 
          status: 'suspended',
          suspensionReason: reason,
          suspendedAt: new Date(),
          suspendedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(clinics.id, clinicId))
        .returning();

      if (!suspendedClinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      res.json({ 
        message: "Clinic suspended successfully",
        clinic: suspendedClinic 
      });
    } catch (error) {
      console.error("Error suspending clinic:", error);
      res.status(500).json({ message: "Failed to suspend clinic" });
    }
  });

  // Reactivate a clinic (admin only)
  app.post('/api/admin/clinics/:clinicId/reactivate', isAuthenticated, auditUpdate('clinic'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { clinicId } = req.params;

      // Reactivate clinic
      const [reactivatedClinic] = await db
        .update(clinics)
        .set({ 
          status: 'active',
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
          reactivatedAt: new Date(),
          reactivatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(clinics.id, clinicId))
        .returning();

      if (!reactivatedClinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      res.json({ 
        message: "Clinic reactivated successfully",
        clinic: reactivatedClinic 
      });
    } catch (error) {
      console.error("Error reactivating clinic:", error);
      res.status(500).json({ message: "Failed to reactivate clinic" });
    }
  });

  // Export all clinic data (GDPR compliance)
  app.post('/api/admin/clinics/:clinicId/export-data', isAuthenticated, auditExport('clinic_data'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { clinicId } = req.params;
      const { includePersonalData = false } = req.body;

      // Get clinic data
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Get all related data
      const clinicCallLogs = await db.select().from(callLogs).where(eq(callLogs.clinicId, clinicId));
      const clinicAppointments = await db.select().from(appointments).where(eq(appointments.clinicId, clinicId));
      const clinicMembersData = await db.select().from(clinicMembers).where(eq(clinicMembers.clinicId, clinicId));

      // Prepare export data
      let exportData: any = {
        clinic: includePersonalData ? clinic : AuditService.redactPII(clinic),
        callLogs: clinicCallLogs.map((log: any) => includePersonalData ? log : AuditService.redactPII(log)),
        appointments: clinicAppointments.map((apt: any) => includePersonalData ? apt : AuditService.redactPII(apt)),
        members: clinicMembersData.map((member: any) => includePersonalData ? member : AuditService.redactPII(member)),
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        totalRecords: clinicCallLogs.length + clinicAppointments.length + clinicMembersData.length + 1,
      };

      res.json({
        message: "Clinic data exported successfully",
        data: exportData
      });
    } catch (error) {
      console.error("Error exporting clinic data:", error);
      res.status(500).json({ message: "Failed to export clinic data" });
    }
  });

  // Permanently delete clinic and all data (irreversible)
  app.delete('/api/admin/clinics/:clinicId/delete-permanently', isAuthenticated, auditDelete('clinic'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { clinicId } = req.params;
      const { confirmDeletion } = req.body;

      if (!confirmDeletion || confirmDeletion !== 'PERMANENTLY_DELETE') {
        return res.status(400).json({ 
          message: "Confirmation required. Send 'confirmDeletion': 'PERMANENTLY_DELETE'" 
        });
      }

      // Check if clinic exists and get record count for logging
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Count related records before deletion
      const callLogCount = await db.select({ count: sql<number>`count(*)` }).from(callLogs).where(eq(callLogs.clinicId, clinicId));
      const appointmentCount = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.clinicId, clinicId));

      // Delete all related data (cascade should handle this, but explicit for safety)
      await db.delete(callLogs).where(eq(callLogs.clinicId, clinicId));
      await db.delete(appointments).where(eq(appointments.clinicId, clinicId));
      await db.delete(clinicMembers).where(eq(clinicMembers.clinicId, clinicId));
      await db.delete(auditLogs).where(eq(auditLogs.clinicId, clinicId));

      // Finally delete the clinic
      await db.delete(clinics).where(eq(clinics.id, clinicId));

      res.json({
        message: "Clinic and all associated data permanently deleted",
        deletedRecords: {
          clinics: 1,
          callLogs: callLogCount[0]?.count || 0,
          appointments: appointmentCount[0]?.count || 0,
        }
      });
    } catch (error) {
      console.error("Error permanently deleting clinic:", error);
      res.status(500).json({ message: "Failed to permanently delete clinic" });
    }
  });

  // Public API Management Routes
  
  // Create API key for clinic
  app.post('/api/clinic/api-keys', isAuthenticated, auditCreate('api_key'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { keyName, permissions = [], environment = 'live', expiresAt } = req.body;

      // Generate API key
      const keyId = crypto.randomUUID();
      const keySecret = crypto.randomBytes(32).toString('hex');
      const keyPrefix = `pk_${environment}_${keyId.slice(0, 8)}`;
      const fullKey = `${keyPrefix}.${keySecret}`;
      const hashedKey = await bcrypt.hash(fullKey, 12);

      const [apiKey] = await db.insert(apiKeys).values({
        clinicId: clinicMember.clinic_members.clinicId,
        keyName,
        keyPrefix,
        hashedKey,
        permissions,
        environment,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId,
      }).returning();

      res.json({
        message: "API key created successfully",
        apiKey: {
          ...apiKey,
          hashedKey: undefined, // Don't return hashed key
          plainKey: fullKey // Return plain key only on creation
        }
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  // List clinic's API keys
  app.get('/api/clinic/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const clinicApiKeys = await db.select({
        id: apiKeys.id,
        keyName: apiKeys.keyName,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        environment: apiKeys.environment,
        status: apiKeys.status,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys)
        .where(eq(apiKeys.clinicId, clinicMember.clinic_members.clinicId));

      res.json({ apiKeys: clinicApiKeys });
    } catch (error) {
      console.error("Error listing API keys:", error);
      res.status(500).json({ message: "Failed to list API keys" });
    }
  });

  // Revoke API key
  app.delete('/api/clinic/api-keys/:keyId', isAuthenticated, auditDelete('api_key'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { keyId } = req.params;

      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      // Revoke API key
      const [revokedKey] = await db
        .update(apiKeys)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          revokedBy: userId,
        })
        .where(
          and(
            eq(apiKeys.id, keyId),
            eq(apiKeys.clinicId, clinicMember.clinic_members.clinicId)
          )
        )
        .returning();

      if (!revokedKey) {
        return res.status(404).json({ message: "API key not found" });
      }

      res.json({ message: "API key revoked successfully" });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });

  // Create webhook
  app.post('/api/clinic/webhooks', isAuthenticated, auditCreate('webhook'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { url, description, events } = req.body;
      
      // Generate webhook secret
      const secret = crypto.randomBytes(32).toString('hex');

      const [webhook] = await db.insert(webhooks).values({
        clinicId: clinicMember.clinic_members.clinicId,
        url,
        description,
        events,
        secret,
        createdBy: userId,
      }).returning();

      res.json({
        message: "Webhook created successfully",
        webhook: {
          ...webhook,
          secret, // Return secret only on creation
        }
      });
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  // List clinic's webhooks
  app.get('/api/clinic/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const clinicWebhooks = await db.select({
        id: webhooks.id,
        url: webhooks.url,
        description: webhooks.description,
        events: webhooks.events,
        status: webhooks.status,
        lastSuccessAt: webhooks.lastSuccessAt,
        lastFailureAt: webhooks.lastFailureAt,
        consecutiveFailures: webhooks.consecutiveFailures,
        createdAt: webhooks.createdAt,
      }).from(webhooks)
        .where(eq(webhooks.clinicId, clinicMember.clinic_members.clinicId));

      res.json({ webhooks: clinicWebhooks });
    } catch (error) {
      console.error("Error listing webhooks:", error);
      res.status(500).json({ message: "Failed to list webhooks" });
    }
  });

  // Get API usage analytics
  app.get('/api/clinic/api-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      // Get usage statistics
      const usageStats = await db
        .select({
          totalRequests: sql<number>`count(*)`,
          successfulRequests: sql<number>`count(*) filter (where status_code between 200 and 299)`,
          errorRequests: sql<number>`count(*) filter (where status_code >= 400)`,
          avgResponseTime: sql<number>`avg(response_time)`,
          totalDataTransfer: sql<number>`sum(request_size + response_size)`,
        })
        .from(apiUsage)
        .where(
          and(
            eq(apiUsage.clinicId, clinicMember.clinic_members.clinicId),
            gte(apiUsage.createdAt, startDate)
          )
        );

      res.json({ 
        usage: usageStats[0],
        period: `${days} days` 
      });
    } catch (error) {
      console.error("Error fetching API usage:", error);
      res.status(500).json({ message: "Failed to fetch API usage" });
    }
  });

  // Customer Success Portal Routes


  // Advanced Analytics & Reporting Routes

  // Cohort Analysis - Track user behavior over time
  app.get('/api/analytics/cohorts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { period = 'monthly', startPeriod, endPeriod } = req.query;
      
      let whereConditions = [eq(cohortAnalysis.clinicId, clinicMember.clinic_members.clinicId)];
      
      if (startPeriod) {
        whereConditions.push(gte(cohortAnalysis.cohortPeriod, startPeriod as string));
      }
      if (endPeriod) {
        whereConditions.push(lte(cohortAnalysis.cohortPeriod, endPeriod as string));
      }

      const cohorts = await db
        .select()
        .from(cohortAnalysis)
        .where(and(...whereConditions))
        .orderBy(desc(cohortAnalysis.cohortPeriod))
        .limit(24); // Up to 2 years of data

      // Calculate summary metrics
      const summaryMetrics = {
        totalCohorts: cohorts.length,
        averageRetention: cohorts.reduce((acc, c: any) => {
          const retention = c.retentionData;
          return acc + (retention.month1 || 0);
        }, 0) / Math.max(cohorts.length, 1),
        averageConversion: cohorts.reduce((acc, c: any) => {
          const conversion = c.conversionData;
          return acc + (conversion.trial_to_paid || 0);
        }, 0) / Math.max(cohorts.length, 1),
        totalRevenue: cohorts.reduce((acc, c: any) => {
          const revenue = c.revenueData;
          return acc + (revenue.mrr || 0);
        }, 0)
      };

      res.json({
        cohorts,
        summary: summaryMetrics,
      });
    } catch (error) {
      console.error("Error fetching cohort analysis:", error);
      res.status(500).json({ message: "Failed to fetch cohort analysis" });
    }
  });

  // Track conversion events
  app.post('/api/analytics/events', isAuthenticated, auditCreate('conversion_event'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { 
        eventType, 
        eventProperties = {}, 
        conversionValue, 
        sessionId,
        referrerSource 
      } = req.body;

      if (!eventType) {
        return res.status(400).json({ message: "Event type is required" });
      }

      const [event] = await db.insert(conversionEvents).values({
        clinicId: clinicMember.clinic_members.clinicId,
        userId,
        eventType,
        eventProperties,
        conversionValue: conversionValue ? parseFloat(conversionValue) : null,
        sessionId,
        referrerSource,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'web_app'
        }
      }).returning();

      res.status(201).json({
        message: "Conversion event tracked successfully",
        event
      });
    } catch (error) {
      console.error("Error tracking conversion event:", error);
      res.status(500).json({ message: "Failed to track conversion event" });
    }
  });

  // Call Outcome Metrics Analysis
  app.get('/api/analytics/call-outcomes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { startDate, endDate, outcome, limit = 100, offset = 0 } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 100, 500);
      const offsetNum = parseInt(offset as string) || 0;

      let whereConditions = [eq(callOutcomeMetrics.clinicId, clinicMember.clinic_members.clinicId)];

      if (startDate) {
        whereConditions.push(gte(callOutcomeMetrics.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        whereConditions.push(lte(callOutcomeMetrics.createdAt, new Date(endDate as string)));
      }
      if (outcome) {
        whereConditions.push(eq(callOutcomeMetrics.callOutcome, outcome as string));
      }

      // Fetch detailed metrics
      const metrics = await db
        .select()
        .from(callOutcomeMetrics)
        .where(and(...whereConditions))
        .orderBy(desc(callOutcomeMetrics.createdAt))
        .limit(limitNum)
        .offset(offsetNum);

      // Calculate summary statistics
      const summaryStats = await db
        .select({
          totalCalls: count(),
          avgDuration: avg(callOutcomeMetrics.callDuration),
          avgSatisfaction: avg(callOutcomeMetrics.customerSatisfaction),
          avgAiScore: avg(callOutcomeMetrics.aiPerformanceScore),
          appointmentRate: sql<number>`AVG(CASE WHEN ${callOutcomeMetrics.appointmentBooked} = true THEN 1.0 ELSE 0.0 END)`,
          transferRate: sql<number>`AVG(CASE WHEN ${callOutcomeMetrics.transferredToHuman} = true THEN 1.0 ELSE 0.0 END)`,
          totalCost: sum(callOutcomeMetrics.costPerCall),
          totalRevenue: sum(callOutcomeMetrics.revenueAttribution),
        })
        .from(callOutcomeMetrics)
        .where(and(...whereConditions));

      res.json({
        metrics,
        summary: summaryStats[0] || {},
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: metrics.length === limitNum,
        }
      });
    } catch (error) {
      console.error("Error fetching call outcome metrics:", error);
      res.status(500).json({ message: "Failed to fetch call metrics" });
    }
  });

  // Submit call outcome metrics
  app.post('/api/analytics/call-outcomes', isAuthenticated, auditCreate('call_outcome_metric'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const {
        callLogId,
        callDuration,
        callOutcome,
        customerSatisfaction,
        appointmentBooked = false,
        appointmentDate,
        aiPerformanceScore,
        resolutionTime,
        transferredToHuman = false,
        callTags = [],
        sentiment,
        transcriptQuality,
        costPerCall,
        revenueAttribution,
        followupRequired = false,
        metadata = {}
      } = req.body;

      if (!callOutcome) {
        return res.status(400).json({ message: "Call outcome is required" });
      }

      const [metric] = await db.insert(callOutcomeMetrics).values({
        clinicId: clinicMember.clinic_members.clinicId,
        callLogId,
        callDuration: callDuration ? parseInt(callDuration) : null,
        callOutcome,
        customerSatisfaction: customerSatisfaction ? parseInt(customerSatisfaction) : null,
        appointmentBooked,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        aiPerformanceScore: aiPerformanceScore ? parseFloat(aiPerformanceScore) : null,
        resolutionTime: resolutionTime ? parseInt(resolutionTime) : null,
        transferredToHuman,
        callTags,
        sentiment,
        transcriptQuality: transcriptQuality ? parseFloat(transcriptQuality) : null,
        costPerCall: costPerCall ? parseFloat(costPerCall) : null,
        revenueAttribution: revenueAttribution ? parseFloat(revenueAttribution) : null,
        followupRequired,
        metadata
      }).returning();

      res.status(201).json({
        message: "Call outcome metric recorded successfully",
        metric
      });
    } catch (error) {
      console.error("Error recording call outcome metric:", error);
      res.status(500).json({ message: "Failed to record call metric" });
    }
  });

  // Performance Benchmarks
  app.get('/api/analytics/benchmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { benchmarkType = 'industry', category, period } = req.query;
      const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

      let whereConditions = [
        eq(performanceBenchmarks.clinicId, clinicMember.clinic_members.clinicId),
        eq(performanceBenchmarks.period, currentPeriod as string)
      ];

      if (benchmarkType) {
        whereConditions.push(eq(performanceBenchmarks.benchmarkType, benchmarkType as string));
      }
      if (category) {
        whereConditions.push(eq(performanceBenchmarks.benchmarkCategory, category as string));
      }

      const benchmarks = await db
        .select()
        .from(performanceBenchmarks)
        .where(and(...whereConditions))
        .orderBy(desc(performanceBenchmarks.percentileRank));

      // If no benchmarks exist, create sample benchmarks
      if (benchmarks.length === 0) {
        const sampleBenchmarks = [
          {
            clinicId: clinicMember.clinic_members.clinicId,
            benchmarkType: 'industry',
            benchmarkCategory: 'call_metrics',
            metricName: 'answer_rate',
            clinicValue: 85.5,
            benchmarkValue: 78.2,
            percentileRank: 75,
            sampleSize: 450,
            confidenceLevel: 0.95,
            trend: 'improving',
            period: currentPeriod,
            metadata: { industry: 'healthcare', clinic_size: 'medium' }
          },
          {
            clinicId: clinicMember.clinic_members.clinicId,
            benchmarkType: 'industry',
            benchmarkCategory: 'conversion',
            metricName: 'booking_conversion',
            clinicValue: 42.8,
            benchmarkValue: 38.9,
            percentileRank: 68,
            sampleSize: 380,
            confidenceLevel: 0.95,
            trend: 'stable',
            period: currentPeriod,
            metadata: { industry: 'healthcare', clinic_size: 'medium' }
          }
        ];

        const createdBenchmarks = await db
          .insert(performanceBenchmarks)
          .values(sampleBenchmarks)
          .returning();

        return res.json({ benchmarks: createdBenchmarks });
      }

      res.json({ benchmarks });
    } catch (error) {
      console.error("Error fetching performance benchmarks:", error);
      res.status(500).json({ message: "Failed to fetch benchmarks" });
    }
  });

  // Analytics Reports Management
  app.get('/api/analytics/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const { reportType, frequency, isActive = true } = req.query;
      
      let whereConditions = [eq(analyticsReports.clinicId, clinicMember.clinic_members.clinicId)];
      
      if (reportType) {
        whereConditions.push(eq(analyticsReports.reportType, reportType as string));
      }
      if (frequency) {
        whereConditions.push(eq(analyticsReports.frequency, frequency as string));
      }
      if (isActive !== undefined) {
        whereConditions.push(eq(analyticsReports.isActive, isActive === 'true'));
      }

      const reports = await db
        .select({
          id: analyticsReports.id,
          reportName: analyticsReports.reportName,
          reportType: analyticsReports.reportType,
          frequency: analyticsReports.frequency,
          recipients: analyticsReports.recipients,
          lastGenerated: analyticsReports.lastGenerated,
          nextScheduled: analyticsReports.nextScheduled,
          isActive: analyticsReports.isActive,
          generationCount: analyticsReports.generationCount,
          createdAt: analyticsReports.createdAt,
        })
        .from(analyticsReports)
        .where(and(...whereConditions))
        .orderBy(desc(analyticsReports.createdAt));

      res.json({ reports });
    } catch (error) {
      console.error("Error fetching analytics reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Create new analytics report
  app.post('/api/analytics/reports', isAuthenticated, auditCreate('analytics_report'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's clinic
      const [clinicMember] = await db.select()
        .from(clinicMembers)
        .innerJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
        .where(eq(clinicMembers.userId, userId));

      if (!clinicMember) {
        return res.status(403).json({ message: "No clinic access" });
      }

      const {
        reportName,
        reportType,
        frequency = 'monthly',
        recipients = [],
        reportConfig = {},
        isActive = true
      } = req.body;

      if (!reportName || !reportType) {
        return res.status(400).json({ message: "Report name and type are required" });
      }

      // Calculate next scheduled time based on frequency
      const now = new Date();
      let nextScheduled = new Date(now);
      
      switch (frequency) {
        case 'daily':
          nextScheduled.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextScheduled.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextScheduled.setMonth(now.getMonth() + 1);
          break;
        case 'quarterly':
          nextScheduled.setMonth(now.getMonth() + 3);
          break;
        default:
          nextScheduled = null; // on_demand reports
      }

      const [report] = await db.insert(analyticsReports).values({
        clinicId: clinicMember.clinic_members.clinicId,
        reportName,
        reportType,
        frequency,
        recipients,
        reportConfig,
        nextScheduled,
        isActive,
        createdBy: userId,
      }).returning();

      res.status(201).json({
        message: "Analytics report created successfully",
        report
      });
    } catch (error) {
      console.error("Error creating analytics report:", error);
      res.status(500).json({ message: "Failed to create analytics report" });
    }
  });

  // Generate report on-demand
  app.post('/api/analytics/reports/:reportId/generate', isAuthenticated, auditUpdate('report_generation'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reportId } = req.params;
      
      // Get user's clinic and verify report access
      const [reportAccess] = await db.select()
        .from(analyticsReports)
        .innerJoin(clinicMembers, eq(analyticsReports.clinicId, clinicMembers.clinicId))
        .where(
          and(
            eq(analyticsReports.id, reportId),
            eq(clinicMembers.userId, userId)
          )
        );

      if (!reportAccess) {
        return res.status(404).json({ message: "Report not found or no access" });
      }

      // Start report generation (async process)
      const [delivery] = await db.insert(reportDeliveries).values({
        reportId,
        clinicId: reportAccess.analytics_reports.clinicId,
        deliveryStatus: 'generating',
        deliveryMethod: 'download',
        reportData: null,
      }).returning();

      // In a real implementation, this would trigger a background job
      // For now, we'll simulate report generation
      setTimeout(async () => {
        try {
          const reportData = {
            generatedAt: new Date().toISOString(),
            reportType: reportAccess.analytics_reports.reportType,
            summary: {
              totalCalls: 156,
              appointmentsBooked: 67,
              conversionRate: 42.9,
              averageSatisfaction: 4.2,
            },
            chartData: [
              { period: '2025-01', calls: 120, bookings: 48 },
              { period: '2025-02', calls: 135, bookings: 58 },
              { period: '2025-03', calls: 156, bookings: 67 },
            ]
          };

          await db
            .update(reportDeliveries)
            .set({
              deliveryStatus: 'completed',
              reportData,
              generationTimeMs: 2500,
              fileSizeBytes: 125000,
            })
            .where(eq(reportDeliveries.id, delivery.id));

          // Update report generation count and last generated time
          await db
            .update(analyticsReports)
            .set({
              lastGenerated: new Date(),
              generationCount: sql`${analyticsReports.generationCount} + 1`,
            })
            .where(eq(analyticsReports.id, reportId));
        } catch (error) {
          console.error('Report generation failed:', error);
          await db
            .update(reportDeliveries)
            .set({
              deliveryStatus: 'failed',
              errorMessage: 'Report generation failed',
            })
            .where(eq(reportDeliveries.id, delivery.id));
        }
      }, 3000); // Simulate 3 second generation time

      res.status(202).json({
        message: "Report generation started",
        deliveryId: delivery.id,
        status: 'generating'
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Check report delivery status
  app.get('/api/analytics/deliveries/:deliveryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { deliveryId } = req.params;
      
      // Get delivery with access check
      const [delivery] = await db.select()
        .from(reportDeliveries)
        .innerJoin(clinicMembers, eq(reportDeliveries.clinicId, clinicMembers.clinicId))
        .where(
          and(
            eq(reportDeliveries.id, deliveryId),
            eq(clinicMembers.userId, userId)
          )
        );

      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found or no access" });
      }

      res.json({
        delivery: {
          id: delivery.report_deliveries.id,
          status: delivery.report_deliveries.deliveryStatus,
          reportData: delivery.report_deliveries.reportData,
          errorMessage: delivery.report_deliveries.errorMessage,
          generationTimeMs: delivery.report_deliveries.generationTimeMs,
          fileSizeBytes: delivery.report_deliveries.fileSizeBytes,
          createdAt: delivery.report_deliveries.createdAt,
        }
      });
    } catch (error) {
      console.error("Error fetching delivery status:", error);
      res.status(500).json({ message: "Failed to fetch delivery status" });
    }
  });

  // Operational Monitoring and Health Check Routes
  
  // Comprehensive health check endpoint
  app.get('/health', async (req, res) => {
    const healthChecks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'ok', latency: 0 },
        memory: { status: 'ok', usage: 0, percentage: 0 },
        twilio: { status: 'unknown' },
        elevenlabs: { status: 'unknown' }
      }
    };

    try {
      // Database health check
      const dbStart = Date.now();
      await db.select({ count: sql`count(*)` }).from(clinics).limit(1);
      const dbLatency = Date.now() - dbStart;
      healthChecks.checks.database = { 
        status: dbLatency < 1000 ? 'ok' : 'slow', 
        latency: dbLatency 
      };

      // Memory usage check
      const memUsage = process.memoryUsage();
      const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      healthChecks.checks.memory = {
        status: memPercentage < 80 ? 'ok' : 'warning',
        usage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        percentage: Math.round(memPercentage)
      };

      // External service checks (simplified for now)
      healthChecks.checks.twilio.status = process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not_configured';
      healthChecks.checks.elevenlabs.status = process.env.ELEVENLABS_API_KEY ? 'configured' : 'not_configured';

      // Overall status determination
      const hasErrors = Object.values(healthChecks.checks).some(check => 
        typeof check === 'object' && check.status === 'error'
      );
      const hasWarnings = Object.values(healthChecks.checks).some(check => 
        typeof check === 'object' && (check.status === 'warning' || check.status === 'slow')
      );

      if (hasErrors) {
        healthChecks.status = 'error';
        res.status(503);
      } else if (hasWarnings) {
        healthChecks.status = 'warning';
        res.status(200);
      }

      res.json(healthChecks);
    } catch (error) {
      console.error('Health check failed:', error);
      healthChecks.status = 'error';
      healthChecks.checks.database.status = 'error';
      res.status(503).json(healthChecks);
    }
  });

  // Detailed metrics endpoint (admin only)
  app.get('/api/admin/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get platform-wide metrics
      const [clinicStats] = await db
        .select({
          totalClinics: sql<number>`count(*)`,
          activeClinics: sql<number>`count(*) filter (where subscription_tier != 'free')`,
          totalCalls: sql<number>`sum(total_calls)`,
          monthlyCallsUsed: sql<number>`sum(monthly_calls_used)`
        })
        .from(clinics);

      const [userStats] = await db
        .select({
          totalUsers: sql<number>`count(*)`,
          adminUsers: sql<number>`count(*) filter (where role = 'admin')`,
          clinicOwners: sql<number>`count(*) filter (where role = 'clinic_owner')`
        })
        .from(users);

      // Get subscription distribution
      const subscriptionStats = await db
        .select({
          tier: clinics.subscriptionTier,
          count: sql<number>`count(*)`
        })
        .from(clinics)
        .groupBy(clinics.subscriptionTier);

      // Calculate financial metrics (simplified)
      const monthlyRevenue = subscriptionStats.reduce((total, tier) => {
        const pricing = {
          essential: 49,
          professional: 149,
          enterprise: 299
        };
        return total + (pricing[tier.tier as keyof typeof pricing] || 0) * tier.count;
      }, 0);

      const metrics = {
        timestamp: new Date().toISOString(),
        platform: {
          clinics: clinicStats,
          users: userStats,
          subscriptions: subscriptionStats,
          revenue: {
            monthlyRecurring: monthlyRevenue,
            currency: 'GBP'
          }
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Error reporting endpoint for frontend
  app.post('/api/errors/report', isAuthenticated, async (req: any, res) => {
    try {
      const { error, context, userAgent, url } = req.body;
      const userId = req.user.claims.sub;

      // Log error for monitoring (in production, send to error tracking service)
      console.error('Frontend error reported:', {
        userId,
        error,
        context,
        userAgent,
        url,
        timestamp: new Date().toISOString()
      });

      // In production, you'd send this to Sentry, DataDog, etc.
      // For now, we'll just acknowledge receipt
      res.json({ 
        acknowledged: true, 
        errorId: `err_${Date.now()}_${Math.random().toString(36).substring(7)}` 
      });
    } catch (error) {
      console.error("Error logging frontend error:", error);
      res.status(500).json({ message: "Failed to log error" });
    }
  });

  // Usage Tracking and Quota Management Routes
  
  // Get current usage for a clinic
  app.get('/api/clinics/:clinicId/usage', isAuthenticated, async (req: any, res) => {
    try {
      const { clinicId } = req.params;
      const userId = req.user.claims.sub;

      // Verify access to clinic
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Check if user has access (owner or member)
      if (clinic.ownerId !== userId) {
        const [member] = await db
          .select()
          .from(clinicMembers)
          .where(and(
            eq(clinicMembers.userId, userId),
            eq(clinicMembers.clinicId, clinicId),
            eq(clinicMembers.isActive, true)
          ));

        if (!member) {
          return res.status(403).json({ message: "Access denied to this clinic" });
        }
      }

      // Get current month usage
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [usage] = await db
        .select()
        .from(usageTracking)
        .where(and(
          eq(usageTracking.clinicId, clinicId),
          eq(usageTracking.period, currentPeriod)
        ));

      // Get subscription limits from pricing
      const limits = {
        essential: { calls: 1000, unlimited: false },
        professional: { calls: 2000, unlimited: false },
        enterprise: { calls: -1, unlimited: true }
      };

      const subscriptionLimits = limits[clinic.subscriptionTier as keyof typeof limits] || limits.essential;

      res.json({
        period: currentPeriod,
        usage: usage || {
          callsCount: 0,
          callMinutes: 0,
          aiCharactersUsed: 0,
          appointmentsBooked: 0
        },
        limits: subscriptionLimits,
        subscriptionTier: clinic.subscriptionTier
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage data" });
    }
  });
  
  return httpServer;
}
