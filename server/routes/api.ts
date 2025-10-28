import { Router } from "express";
import { db } from "../db";
import { apiConfigurations, clinics } from "@shared/schema";
import { eq } from "drizzle-orm";
import { GoogleSheetsService } from "../services/googleSheets";
import { ElevenLabsService } from "../services/elevenlabs";
import { TwilioService } from "../services/twilio";
import { ContextualHelpService } from "../services/contextualHelp";
import { isAuthenticated } from "../replitAuth";
import { EncryptionService, requireAuth, auditLog, createRateLimit } from "../middleware/security";
import { z } from "zod";

const router = Router();

// Input validation schemas
const createGoogleSheetSchema = z.object({
  clinicId: z.string().uuid(),
  clinicName: z.string().min(1).max(100),
  serviceAccountKey: z.string().min(1),
});

const addPatientSchema = z.object({
  clinicId: z.string().uuid(),
  appointment: z.object({
    patientName: z.string().min(1).max(100),
    patientEmail: z.string().email().optional(),
    patientPhone: z.string().optional(),
    appointmentDate: z.string(),
    appointmentTime: z.string(),
    service: z.string().optional(),
  }),
});

// Google Sheets Integration
router.post("/api/google-sheets/create", 
  requireAuth, 
  createRateLimit(60 * 1000, 5), // 5 requests per minute
  auditLog('google_sheets_create'),
  async (req: any, res) => {
  try {
    const validatedData = createGoogleSheetSchema.parse(req.body);
    const { clinicId, clinicName, serviceAccountKey } = validatedData;

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    const googleSheets = new GoogleSheetsService(serviceAccountKey);
    const spreadsheetId = await googleSheets.createPatientSheet(clinicName);

    // Encrypt and save configuration
    await db.insert(apiConfigurations).values({
      clinicId,
      googleServiceAccountKey: EncryptionService.encrypt(serviceAccountKey),
    }).onConflictDoUpdate({
      target: apiConfigurations.clinicId,
      set: {
        googleServiceAccountKey: EncryptionService.encrypt(serviceAccountKey),
        updatedAt: new Date(),
      },
    });

    res.json({ spreadsheetId, success: true });
  } catch (error) {
    console.error("Error creating Google Sheet:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create Google Sheet" });
  }
});

router.post("/api/google-sheets/add-patient", 
  requireAuth,
  createRateLimit(60 * 1000, 20), // 20 requests per minute
  auditLog('google_sheets_add_patient'),
  async (req: any, res) => {
  try {
    const validatedData = addPatientSchema.parse(req.body);
    const { clinicId, appointment } = validatedData;

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (!config?.googleServiceAccountKey) {
      return res.status(400).json({ 
        message: "Google Sheets not configured for this clinic" 
      });
    }

    if (!clinic.googleSheetsId) {
      return res.status(400).json({ 
        message: "Google Sheets ID not found for this clinic" 
      });
    }

    // Decrypt the service account key (handle both encrypted and legacy plaintext)
    let decryptedKey;
    try {
      decryptedKey = EncryptionService.decrypt(config.googleServiceAccountKey as string || '');
    } catch {
      // Fallback for legacy plaintext keys
      decryptedKey = config.googleServiceAccountKey;
    }
    const googleSheets = new GoogleSheetsService(decryptedKey);
    await googleSheets.addPatientRecord(clinic.googleSheetsId, appointment);

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding patient to Google Sheet:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add patient record" });
  }
});

// ElevenLabs Integration
router.post("/api/elevenlabs/generate-speech", 
  requireAuth,
  createRateLimit(60 * 1000, 20), // 20 requests per minute
  auditLog('elevenlabs_generate_speech'),
  async (req: any, res) => {
  try {
    const { clinicId, text, voiceId } = req.body;

    if (!clinicId || !text) {
      return res.status(400).json({ 
        message: "Clinic ID and text are required" 
      });
    }

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Check AI character quota
    const characterCount = text.length;
    const subscriptionLimits = {
      essential: { aiCharacters: 50000 },
      professional: { aiCharacters: 125000 },
      enterprise: { aiCharacters: -1 } // unlimited
    };

    const limits = subscriptionLimits[clinic.subscriptionTier as keyof typeof subscriptionLimits] || subscriptionLimits.essential;
    
    // For simplicity, we'll use monthlyCallsUsed as a proxy for AI usage tracking
    // In production, you'd want a separate aiCharactersUsed field
    const estimatedCurrentUsage = clinic.monthlyCallsUsed * 100; // Estimate based on calls
    
    if (limits.aiCharacters !== -1 && (estimatedCurrentUsage + characterCount) > limits.aiCharacters) {
      return res.status(429).json({
        message: `Monthly AI character quota (${limits.aiCharacters}) would be exceeded. Upgrade your plan to continue.`,
        currentUsage: estimatedCurrentUsage,
        requestedCharacters: characterCount,
        limit: limits.aiCharacters,
        subscriptionTier: clinic.subscriptionTier,
        upgradeRequired: true
      });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (!config?.elevenlabsApiKey) {
      return res.status(400).json({ 
        message: "ElevenLabs not configured for this clinic" 
      });
    }

    // Decrypt API key for use (handle both encrypted and legacy plaintext)
    let decryptedApiKey;
    try {
      decryptedApiKey = EncryptionService.decrypt(config.elevenlabsApiKey);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedApiKey = config.elevenlabsApiKey;
    }

    const elevenlabs = new ElevenLabsService(decryptedApiKey);
    const audioBuffer = await elevenlabs.generateSpeech(
      text, 
      voiceId || config.elevenlabsVoiceId || "default"
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ message: "Failed to generate speech" });
  }
});

router.get("/api/elevenlabs/voices", 
  requireAuth,
  createRateLimit(60 * 1000, 30), // 30 requests per minute
  auditLog('elevenlabs_get_voices'),
  async (req: any, res) => {
  try {
    const { clinicId } = req.query;

    if (!clinicId) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId as string));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId as string));

    if (!config?.elevenlabsApiKey) {
      return res.status(400).json({ 
        message: "ElevenLabs not configured for this clinic" 
      });
    }

    // Decrypt API key for use (handle both encrypted and legacy plaintext)
    let decryptedApiKey;
    try {
      decryptedApiKey = EncryptionService.decrypt(config.elevenlabsApiKey);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedApiKey = config.elevenlabsApiKey;
    }

    const elevenlabs = new ElevenLabsService(decryptedApiKey);
    const voices = await elevenlabs.getVoices();

    res.json({ voices });
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({ message: "Failed to fetch voices" });
  }
});

// Twilio Integration
router.post("/api/twilio/webhook", async (req, res) => {
  try {
    const { clinicId } = req.query;

    if (!clinicId) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId as string));

    if (!config?.twilioAccountSid || !config?.twilioAuthToken) {
      return res.status(400).json({ 
        message: "Twilio not configured for this clinic" 
      });
    }

    // Decrypt auth token for signature validation and client use
    let decryptedAuthToken;
    try {
      decryptedAuthToken = EncryptionService.decrypt(config.twilioAuthToken);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedAuthToken = config.twilioAuthToken;
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    if (!twilioSignature) {
      console.error('Missing Twilio signature header');
      return res.status(401).json({ message: 'Missing Twilio signature' });
    }

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = TwilioService.validateRequest(
      decryptedAuthToken, 
      twilioSignature, 
      url, 
      req.body
    );
    
    if (!isValid) {
      console.error('Invalid Twilio signature for webhook');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const twilio = new TwilioService({
      accountSid: config.twilioAccountSid,
      authToken: decryptedAuthToken,
      phoneNumber: config.twilioPhoneNumber || ''
    });

    const twimlResponse = twilio.generateTwiML("Welcome to the clinic. How can I help you today?");
    
    res.set('Content-Type', 'text/xml');
    res.send(twimlResponse);
  } catch (error) {
    console.error("Error handling Twilio webhook:", error);
    
    // Return safe TwiML error response
    const errorTwiml = new TwilioService({
      accountSid: 'fallback',
      authToken: 'fallback',
      phoneNumber: 'fallback'
    }).generateSimpleTwiML("We're experiencing technical difficulties. Please try calling again.");
    
    res.set('Content-Type', 'text/xml');
    res.status(500).send(errorTwiml);
  }
});

router.post("/api/twilio/speech", async (req, res) => {
  try {
    const { clinicId } = req.query;
    const { SpeechResult } = req.body;

    if (!clinicId) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId as string));

    if (!config?.twilioAccountSid || !config?.twilioAuthToken) {
      return res.status(400).json({ 
        message: "Twilio not configured for this clinic" 
      });
    }

    // Decrypt auth token for signature validation and client use
    let decryptedAuthToken;
    try {
      decryptedAuthToken = EncryptionService.decrypt(config.twilioAuthToken);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedAuthToken = config.twilioAuthToken;
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    if (!twilioSignature) {
      console.error('Missing Twilio signature header');
      return res.status(401).json({ message: 'Missing Twilio signature' });
    }

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = TwilioService.validateRequest(
      decryptedAuthToken, 
      twilioSignature, 
      url, 
      req.body
    );
    
    if (!isValid) {
      console.error('Invalid Twilio signature for speech endpoint');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const twilio = new TwilioService({
      accountSid: config.twilioAccountSid,
      authToken: decryptedAuthToken,
      phoneNumber: config.twilioPhoneNumber || ''
    });

    const responseMessage = SpeechResult ? 
      `You said: ${SpeechResult}. How else can I help you?` : 
      "I didn't catch that. Could you please repeat your request?";
      
    const twimlResponse = twilio.generateSpeechResponseTwiML(responseMessage, true);
    
    res.set('Content-Type', 'text/xml');
    res.send(twimlResponse);
  } catch (error) {
    console.error("Error handling speech input:", error);
    
    // Return safe TwiML error response
    const errorTwiml = new TwilioService({
      accountSid: 'fallback',
      authToken: 'fallback', 
      phoneNumber: 'fallback'
    }).generateSimpleTwiML("We're experiencing technical difficulties. Please try calling again.");
    
    res.set('Content-Type', 'text/xml');
    res.status(500).send(errorTwiml);
  }
});

router.post("/api/twilio/send-sms", 
  requireAuth,
  createRateLimit(60 * 1000, 10), // 10 SMS per minute
  auditLog('twilio_send_sms'),
  async (req: any, res) => {
  try {
    const { clinicId, to, message } = req.body;

    if (!clinicId || !to || !message) {
      return res.status(400).json({ 
        message: "Clinic ID, recipient, and message are required" 
      });
    }

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (!config?.twilioAccountSid || !config?.twilioAuthToken) {
      return res.status(400).json({ 
        message: "Twilio not configured for this clinic" 
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      return res.status(400).json({ 
        message: "Invalid phone number format. Use E.164 format (e.g., +441234567890)" 
      });
    }

    // Validate message length (SMS limit is 160 characters)
    if (message.length > 1600) { // Allow up to 10 SMS segments
      return res.status(400).json({ 
        message: "Message too long. Maximum 1600 characters allowed." 
      });
    }

    // Decrypt auth token for use (handle both encrypted and legacy plaintext)
    let decryptedAuthToken;
    try {
      decryptedAuthToken = EncryptionService.decrypt(config.twilioAuthToken);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedAuthToken = config.twilioAuthToken;
    }

    // Validate Twilio phone number (from number) for SMS
    if (config.twilioPhoneNumber && !/^\+[1-9]\d{1,14}$/.test(config.twilioPhoneNumber)) {
      return res.status(400).json({ 
        message: "Invalid Twilio phone number configuration. Please check your settings." 
      });
    }

    const twilio = new TwilioService({
      accountSid: config.twilioAccountSid,
      authToken: decryptedAuthToken,
      phoneNumber: config.twilioPhoneNumber || ''
    });

    const result = await twilio.sendSMS(to, message);
    const messageSid = result.messageSid;

    res.json({ messageSid, success: true });
  } catch (error) {
    console.error("Error sending SMS:", error);
    if (error instanceof Error && error.message.includes('phone number')) {
      return res.status(400).json({ 
        message: "Invalid phone number or SMS service unavailable" 
      });
    }
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

// Twilio Call Placement with quota enforcement
router.post("/api/twilio/make-call", 
  requireAuth,
  createRateLimit(60 * 1000, 5), // 5 calls per minute
  auditLog('twilio_make_call'),
  async (req: any, res) => {
  try {
    const { clinicId, to } = req.body;

    if (!clinicId || !to) {
      return res.status(400).json({ 
        message: "Clinic ID and phone number are required" 
      });
    }

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Check subscription quotas before making call
    const subscriptionLimits = {
      essential: { calls: 1000 },
      professional: { calls: 2500 },
      enterprise: { calls: -1 } // unlimited
    };

    const limits = subscriptionLimits[clinic.subscriptionTier as keyof typeof subscriptionLimits] || subscriptionLimits.essential;
    
    if (limits.calls !== -1 && clinic.monthlyCallsUsed >= limits.calls) {
      return res.status(429).json({
        message: `Monthly call quota (${limits.calls}) exceeded. Upgrade your plan to continue.`,
        currentUsage: clinic.monthlyCallsUsed,
        limit: limits.calls,
        subscriptionTier: clinic.subscriptionTier,
        upgradeRequired: true
      });
    }

    // Get API configuration
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (!config?.twilioAccountSid || !config?.twilioAuthToken) {
      return res.status(400).json({ 
        message: "Twilio not configured for this clinic" 
      });
    }

    // Decrypt auth token for use (handle both encrypted and legacy plaintext)
    let decryptedAuthToken;
    try {
      decryptedAuthToken = EncryptionService.decrypt(config.twilioAuthToken);
    } catch {
      // Fallback for legacy plaintext tokens
      decryptedAuthToken = config.twilioAuthToken;
    }

    // Validate Twilio phone number (from number)
    if (!config.twilioPhoneNumber) {
      return res.status(400).json({ 
        message: "Twilio phone number not configured for this clinic" 
      });
    }

    // Validate from phone number
    if (!/^\+[1-9]\d{1,14}$/.test(config.twilioPhoneNumber)) {
      return res.status(400).json({ 
        message: "Invalid Twilio phone number configuration. Please check your settings." 
      });
    }

    // Validate to phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(to)) {
      return res.status(400).json({ 
        message: "Invalid phone number format. Use E.164 format (e.g., +441234567890)" 
      });
    }

    const twilio = new TwilioService({
      accountSid: config.twilioAccountSid,
      authToken: decryptedAuthToken,
      phoneNumber: config.twilioPhoneNumber || ''
    });

    // Create webhook URL for this clinic
    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const webhookUrl = `${baseUrl}/api/twilio/webhook?clinicId=${clinicId}`;

    const result = await twilio.makeCall(to, webhookUrl);
    
    // Track usage: increment call count for the clinic
    try {
      await db
        .update(clinics)
        .set({ 
          monthlyCallsUsed: clinic.monthlyCallsUsed + 1,
          totalCalls: clinic.totalCalls + 1,
          updatedAt: new Date()
        })
        .where(eq(clinics.id, clinicId));
    } catch (trackingError) {
      console.error("Error tracking call usage:", trackingError);
      // Don't fail the request if usage tracking fails
    }
    
    res.json({ 
      callSid: result.callSid,
      status: result.status,
      to: result.to,
      from: result.from,
      success: true 
    });
  } catch (error) {
    console.error("Error making call:", error);
    if (error instanceof Error && error.message.includes('phone number')) {
      return res.status(400).json({ 
        message: "Invalid phone number or calling service unavailable" 
      });
    }
    res.status(500).json({ message: "Failed to make call" });
  }
});

// API Configuration Management
router.post("/api/configurations", 
  requireAuth,
  createRateLimit(60 * 1000, 10), // 10 requests per minute
  auditLog('api_config_update'),
  async (req: any, res) => {
  try {
    const { clinicId, ...configData } = req.body;

    if (!clinicId) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    // Encrypt sensitive fields
    const encryptedConfigData = { ...configData };
    if (configData.twilioAuthToken) {
      encryptedConfigData.twilioAuthToken = EncryptionService.encrypt(configData.twilioAuthToken);
    }
    if (configData.elevenlabsApiKey) {
      encryptedConfigData.elevenlabsApiKey = EncryptionService.encrypt(configData.elevenlabsApiKey);
    }

    // Check if configuration exists
    const [existingConfig] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (existingConfig) {
      // Update existing configuration
      await db
        .update(apiConfigurations)
        .set({ ...encryptedConfigData, updatedAt: new Date() })
        .where(eq(apiConfigurations.clinicId, clinicId));
    } else {
      // Create new configuration
      await db.insert(apiConfigurations).values({
        clinicId,
        ...encryptedConfigData,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving API configuration:", error);
    res.status(500).json({ message: "Failed to save configuration" });
  }
});

router.get("/api/configurations/:clinicId", 
  requireAuth,
  createRateLimit(60 * 1000, 20), // 20 requests per minute
  auditLog('api_config_read'),
  async (req: any, res) => {
  try {
    const { clinicId } = req.params;

    // Verify clinic ownership
    const userId = req.user.claims.sub;
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic || clinic.ownerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to clinic" });
    }

    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.clinicId, clinicId));

    if (!config) {
      return res.status(404).json({ 
        message: "Configuration not found" 
      });
    }

    // Don't return sensitive data in full
    const safeConfig = {
      ...config,
      googleServiceAccountKey: config.googleServiceAccountKey ? "***configured***" : null,
      elevenlabsApiKey: config.elevenlabsApiKey ? "***configured***" : null,
      twilioAuthToken: config.twilioAuthToken ? "***configured***" : null,
    };

    res.json(safeConfig);
  } catch (error) {
    console.error("Error fetching API configuration:", error);
    res.status(500).json({ message: "Failed to fetch configuration" });
  }
});

// Contextual Help System
const contextualHelpSchema = z.object({
  question: z.string().min(1).max(500),
  context: z.string().max(200),
  page: z.string().max(50),
});

router.post("/api/help/contextual", 
  requireAuth,
  createRateLimit(60 * 1000, 10), // 10 requests per minute
  async (req: any, res) => {
  try {
    const validatedData = contextualHelpSchema.parse(req.body);
    const { question, context, page } = validatedData;

    const helpService = new ContextualHelpService();
    const response = await helpService.getContextualHelp({
      question,
      context,
      page,
      userId: req.user?.claims?.sub
    });

    // Audit log for help requests
    console.log(`[HELP] User ${req.user?.claims?.sub} asked: "${question}" on page: ${page}`);

    res.json(response);
  } catch (error) {
    console.error("Error providing contextual help:", error);
    res.status(500).json({ 
      message: "Failed to provide help response",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;