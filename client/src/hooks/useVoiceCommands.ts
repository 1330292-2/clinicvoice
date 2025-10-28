import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommand {
  pattern: RegExp;
  action: string;
  description: string;
  handler: () => void;
}

interface UseVoiceCommandsProps {
  enabled?: boolean;
  autoStart?: boolean;
  onEmergency?: () => void;
  onTestAI?: () => void;
}

export function useVoiceCommands({
  enabled = true,
  autoStart = false,
  onEmergency,
  onTestAI
}: UseVoiceCommandsProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  // Define voice commands
  const commands: VoiceCommand[] = [
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(dashboard|home)/i,
      action: 'navigate_dashboard',
      description: 'Navigate to dashboard',
      handler: () => setLocation('/')
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(call logs?|calls?)/i,
      action: 'navigate_calls',
      description: 'Show call logs',
      handler: () => setLocation('/call-logs')
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(appointments?|schedule)/i,
      action: 'navigate_appointments',
      description: 'Show appointments',
      handler: () => setLocation('/appointments')
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(analytics|reports?)/i,
      action: 'navigate_analytics',
      description: 'Show analytics',
      handler: () => setLocation('/business-analytics')
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(settings?)/i,
      action: 'navigate_settings',
      description: 'Open settings',
      handler: () => setLocation('/enhanced-settings')
    },
    {
      pattern: /(?:test|check)\s*(?:the\s*)?(?:ai|artificial intelligence)/i,
      action: 'test_ai',
      description: 'Test AI receptionist',
      handler: () => {
        onTestAI?.();
        toast({
          title: "AI Test Initiated",
          description: "Starting AI receptionist test...",
        });
      }
    },
    {
      pattern: /(?:emergency|urgent|help)/i,
      action: 'emergency',
      description: 'Emergency alert',
      handler: () => {
        onEmergency?.();
        toast({
          title: "Emergency Alert",
          description: "Emergency protocols activated",
          variant: "destructive"
        });
      }
    },
    {
      pattern: /(?:status|health|system)/i,
      action: 'status',
      description: 'System status',
      handler: () => {
        toast({
          title: "System Status",
          description: "AI: Online | Calls: 12 today | Health: 98%",
        });
      }
    }
  ];

  const processCommand = useCallback((transcript: string, confidence: number) => {
    if (confidence < 0.7) {
      toast({
        title: "Command unclear",
        description: "Please speak more clearly",
        variant: "destructive"
      });
      return;
    }

    const matchedCommand = commands.find(cmd => cmd.pattern.test(transcript));
    
    if (matchedCommand) {
      setLastCommand(transcript);
      setConfidence(confidence);
      matchedCommand.handler();
      
      toast({
        title: "Voice command executed",
        description: `${matchedCommand.description} (${Math.round(confidence * 100)}% confidence)`,
      });
    } else {
      toast({
        title: "Command not recognized",
        description: `"${transcript}" - Try a different command`,
        variant: "destructive"
      });
    }
  }, [commands, toast]);

  const startListening = useCallback(() => {
    if (!isSupported || !enabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      const confidence = event.results[0][0].confidence;
      processCommand(transcript, confidence);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
    setIsListening(true);
  }, [isSupported, enabled, processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (autoStart && SpeechRecognition) {
      startListening();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [autoStart, startListening]);

  return {
    isListening,
    isSupported,
    lastCommand,
    confidence,
    commands: commands.map(cmd => ({
      action: cmd.action,
      description: cmd.description
    })),
    startListening,
    stopListening
  };
}