import { Router } from 'express';
import { db } from '../db';
import { clinics, callLogs, appointments, users } from '@shared/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { apiKeyAuth, requirePermission, rateLimit, trackApiUsage } from '../middleware/api-auth';
import { z } from 'zod';

const router = Router();

// Apply middleware to all public API routes
router.use('/api/v1', apiKeyAuth, trackApiUsage);

// Rate limiting for different endpoint categories
const standardRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 1000 }); // 1000 req/15min
const strictRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 }); // 100 req/15min

// API Documentation and Status Endpoints

// Get API status and version
router.get('/api/v1', (req: any, res) => {
  res.json({
    name: 'ClinicVoice API',
    version: '1.0.0',
    description: 'AI-powered healthcare clinic management API',
    documentation: 'https://docs.clinicvoice.co.uk/api',
    status: 'operational',
    environment: req.apiKey?.environment || 'unknown',
    rate_limit: req.rateLimitInfo,
    clinic: {
      id: req.clinic?.id,
      name: req.clinic?.name,
    },
  });
});

// Clinic Information Endpoints

// Get clinic details
router.get('/api/v1/clinic', standardRateLimit, requirePermission('read:clinic'), (req: any, res) => {
  const clinic = {
    id: req.clinic.id,
    name: req.clinic.name,
    phoneNumber: req.clinic.phoneNumber,
    email: req.clinic.email,
    website: req.clinic.website,
    address: req.clinic.address,
    description: req.clinic.description,
    subscriptionTier: req.clinic.subscriptionTier,
    isActive: req.clinic.isActive,
    createdAt: req.clinic.createdAt,
  };

  res.json({ clinic });
});

// Call Logs Endpoints

// List call logs
router.get('/api/v1/calls', standardRateLimit, requirePermission('read:calls'), async (req: any, res) => {
  try {
    const { limit = 50, offset = 0, from, to, status } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let whereConditions = [eq(callLogs.clinicId, req.clinic.id)];

    // Date range filtering
    if (from) {
      whereConditions.push(gte(callLogs.createdAt, new Date(from as string)));
    }
    if (to) {
      whereConditions.push(lte(callLogs.createdAt, new Date(to as string)));
    }
    
    // Status filtering
    if (status) {
      whereConditions.push(eq(callLogs.callStatus, status as string));
    }

    const calls = await db
      .select({
        id: callLogs.id,
        twilioCallSid: callLogs.twilioCallSid,
        callerPhone: callLogs.callerPhone,
        callType: callLogs.callType,
        transcript: callLogs.transcript,
        summary: callLogs.summary,
        duration: callLogs.duration,
        callStatus: callLogs.callStatus,
        sentimentScore: callLogs.sentimentScore,
        appointmentBooked: callLogs.appointmentBooked,
        appointmentId: callLogs.appointmentId,
        cost: callLogs.cost,
        createdAt: callLogs.createdAt,
      })
      .from(callLogs)
      .where(and(...whereConditions))
      .orderBy(desc(callLogs.createdAt))
      .limit(limitNum)
      .offset(offsetNum);

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(callLogs)
      .where(and(...whereConditions));

    res.json({
      calls,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalCount[0]?.count || 0,
        hasMore: (offsetNum + limitNum) < (totalCount[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch call logs'
    });
  }
});

// Get specific call log
router.get('/api/v1/calls/:callId', standardRateLimit, requirePermission('read:calls'), async (req: any, res) => {
  try {
    const { callId } = req.params;

    const [call] = await db
      .select()
      .from(callLogs)
      .where(
        and(
          eq(callLogs.id, callId),
          eq(callLogs.clinicId, req.clinic.id)
        )
      );

    if (!call) {
      return res.status(404).json({
        error: 'call_not_found',
        message: 'Call log not found'
      });
    }

    res.json({ call });
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch call log'
    });
  }
});

// Appointments Endpoints

// List appointments
router.get('/api/v1/appointments', standardRateLimit, requirePermission('read:appointments'), async (req: any, res) => {
  try {
    const { limit = 50, offset = 0, from, to, status } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let whereConditions = [eq(appointments.clinicId, req.clinic.id)];

    // Date range filtering
    if (from) {
      whereConditions.push(gte(appointments.appointmentDate, new Date(from as string)));
    }
    if (to) {
      whereConditions.push(lte(appointments.appointmentDate, new Date(to as string)));
    }
    
    // Status filtering
    if (status) {
      whereConditions.push(eq(appointments.status, status as string));
    }

    const clinicAppointments = await db
      .select({
        id: appointments.id,
        callLogId: appointments.callLogId,
        patientName: appointments.patientName,
        patientPhone: appointments.patientPhone,
        patientEmail: appointments.patientEmail,
        appointmentDate: appointments.appointmentDate,
        appointmentType: appointments.appointmentType,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(and(...whereConditions))
      .orderBy(desc(appointments.appointmentDate))
      .limit(limitNum)
      .offset(offsetNum);

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(...whereConditions));

    res.json({
      appointments: clinicAppointments,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalCount[0]?.count || 0,
        hasMore: (offsetNum + limitNum) < (totalCount[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch appointments'
    });
  }
});

// Create appointment
const createAppointmentSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email().optional(),
  appointmentDate: z.string().transform(str => new Date(str)),
  appointmentType: z.string().optional(),
  duration: z.number().min(15).max(480).default(30),
  notes: z.string().optional(),
});

router.post('/api/v1/appointments', strictRateLimit, requirePermission('write:appointments'), async (req: any, res) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);

    const [appointment] = await db
      .insert(appointments)
      .values({
        clinicId: req.clinic.id,
        ...validatedData,
      })
      .returning();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid appointment data',
        details: error.errors,
      });
    }

    console.error('Error creating appointment:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create appointment'
    });
  }
});

// Update appointment
router.put('/api/v1/appointments/:appointmentId', strictRateLimit, requirePermission('write:appointments'), async (req: any, res) => {
  try {
    const { appointmentId } = req.params;
    const validatedData = createAppointmentSchema.partial().parse(req.body);

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinicId, req.clinic.id)
        )
      )
      .returning();

    if (!updatedAppointment) {
      return res.status(404).json({
        error: 'appointment_not_found',
        message: 'Appointment not found'
      });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid appointment data',
        details: error.errors,
      });
    }

    console.error('Error updating appointment:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update appointment'
    });
  }
});

// Analytics Endpoints

// Get clinic analytics
router.get('/api/v1/analytics', standardRateLimit, requirePermission('read:analytics'), async (req: any, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Call statistics
    const callStats = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`count(*) filter (where call_status = 'completed')`,
        appointmentsBooked: sql<number>`count(*) filter (where appointment_booked = true)`,
        avgDuration: sql<number>`avg(duration)`,
        avgSentiment: sql<number>`avg(sentiment_score)`,
        totalCost: sql<number>`sum(cost)`,
      })
      .from(callLogs)
      .where(
        and(
          eq(callLogs.clinicId, req.clinic.id),
          gte(callLogs.createdAt, startDate)
        )
      );

    // Appointment statistics
    const appointmentStats = await db
      .select({
        totalAppointments: sql<number>`count(*)`,
        confirmedAppointments: sql<number>`count(*) filter (where status = 'confirmed')`,
        cancelledAppointments: sql<number>`count(*) filter (where status = 'cancelled')`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, req.clinic.id),
          gte(appointments.createdAt, startDate)
        )
      );

    res.json({
      period: `${days} days`,
      analytics: {
        calls: callStats[0] || {},
        appointments: appointmentStats[0] || {},
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch analytics'
    });
  }
});

// Error handler for API routes
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Public API error:', error);
  
  res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

export default router;