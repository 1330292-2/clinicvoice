import twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  
  constructor(private config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
  }

  // Make an outbound call
  async makeCall(to: string, webhookUrl: string) {
    try {
      const call = await this.client.calls.create({
        url: webhookUrl, // TwiML webhook URL
        to: to,
        from: this.config.phoneNumber,
        record: true, // Enable call recording
        recordingStatusCallback: `${webhookUrl}/recording-status`,
        statusCallback: `${webhookUrl}/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        timeout: 30, // Ring timeout in seconds
      });

      return {
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
      };
    } catch (error) {
      console.error('Error making call:', error);
      throw new Error(`Failed to make call: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Send SMS
  async sendSMS(to: string, message: string) {
    try {
      const sms = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: to,
      });

      return {
        messageSid: sms.sid,
        status: sms.status,
        to: sms.to,
        from: sms.from,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Get call details
  async getCallDetails(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch();
      
      return {
        sid: call.sid,
        status: call.status,
        duration: call.duration ? parseInt(call.duration) : 0,
        startTime: call.startTime,
        endTime: call.endTime,
        from: call.from,
        to: call.to,
        price: call.price,
        priceUnit: call.priceUnit,
      };
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw new Error(`Failed to fetch call details: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Get call recording
  async getCallRecording(callSid: string) {
    try {
      const recordings = await this.client.recordings.list({
        callSid: callSid,
        limit: 1,
      });

      if (recordings.length > 0) {
        const recording = recordings[0];
        return {
          recordingSid: recording.sid,
          duration: recording.duration,
          uri: recording.uri,
          mediaUrl: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw new Error(`Failed to fetch recording: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Purchase UK phone number
  async purchaseUKPhoneNumber() {
    try {
      // Search for available UK phone numbers
      const numbers = await this.client.availablePhoneNumbers('GB')
        .local
        .list({
          areaCode: 20, // London area code for professional appearance
          limit: 10
        });

      if (numbers.length === 0) {
        throw new Error('No UK phone numbers available');
      }

      // Purchase the first available number
      const selectedNumber = numbers[0];
      const purchasedNumber = await this.client.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber.phoneNumber,
        voiceUrl: process.env.TWILIO_WEBHOOK_URL || 'https://your-app.com/api/twilio/voice',
        voiceMethod: 'POST',
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || 'https://your-app.com/api/twilio/status',
        statusCallbackMethod: 'POST',
      });

      return {
        phoneNumber: purchasedNumber.phoneNumber,
        sid: purchasedNumber.sid,
        friendlyName: purchasedNumber.friendlyName,
      };
    } catch (error) {
      console.error('Error purchasing phone number:', error);
      throw new Error(`Failed to purchase phone number: ${error instanceof Error ? error.message : error}`);
    }
  }

  // List owned phone numbers
  async listPhoneNumbers() {
    try {
      const numbers = await this.client.incomingPhoneNumbers.list();
      
      return numbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        voiceUrl: number.voiceUrl,
        capabilities: number.capabilities,
      }));
    } catch (error) {
      console.error('Error listing phone numbers:', error);
      throw new Error(`Failed to list phone numbers: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Generate TwiML response for incoming calls
  generateTwiML(message: string = "Hello! Thank you for calling. Please hold while we connect you to our AI assistant.") {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add a greeting message
    twiml.say({
      voice: 'alice',
      language: 'en-GB' // British English
    }, message);

    // Start recording the call
    twiml.record({
      timeout: 10,
      transcribe: true,
      transcribeCallback: '/api/twilio/transcribe',
      recordingStatusCallback: '/api/twilio/recording-status',
      maxLength: 3600, // 1 hour max
    });

    return twiml.toString();
  }

  // Generate simple TwiML response with just a message
  generateSimpleTwiML(message: string): string {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, message);
    return twiml.toString();
  }

  // Generate TwiML for speech input processing
  generateSpeechResponseTwiML(message: string, continueListening: boolean = true): string {
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, message);

    if (continueListening) {
      twiml.gather({
        input: ['speech'],
        action: '/api/twilio/speech',
        method: 'POST',
        speechTimeout: 'auto',
        timeout: 5
      });
    }

    return twiml.toString();
  }

  // Validate webhook signature for security
  validateSignature(signature: string, url: string, params: any): boolean {
    const authToken = this.config.authToken;
    return twilio.validateRequest(authToken, signature, url, params);
  }

  // Static method to validate signature without instance
  static validateRequest(authToken: string, signature: string, url: string, params: any): boolean {
    return twilio.validateRequest(authToken, signature, url, params);
  }

  // Middleware function for signature validation
  static createSignatureValidationMiddleware(getAuthToken: (req: any) => string | null) {
    return (req: any, res: any, next: any) => {
      try {
        const twilioSignature = req.headers['x-twilio-signature'] as string;
        
        if (!twilioSignature) {
          console.error('Missing Twilio signature header');
          return res.status(401).json({ message: 'Missing Twilio signature' });
        }

        const authToken = getAuthToken(req);
        if (!authToken) {
          console.error('Unable to retrieve auth token for signature validation');
          return res.status(500).json({ message: 'Configuration error' });
        }

        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const isValid = TwilioService.validateRequest(authToken, twilioSignature, url, req.body);
        
        if (!isValid) {
          console.error('Invalid Twilio signature for URL:', url);
          return res.status(403).json({ message: 'Invalid signature' });
        }

        next();
      } catch (error) {
        console.error('Error validating Twilio signature:', error);
        res.status(500).json({ message: 'Signature validation error' });
      }
    };
  }
}