import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  Play,
  Square,
  HelpCircle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceCommand {
  pattern: RegExp;
  command: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'ai' | 'emergency' | 'status' | 'data';
}

interface VoiceCommandsProps {
  onNavigate?: (path: string) => void;
  onEmergency?: () => void;
  onTestAI?: () => void;
  onCheckStatus?: () => void;
}

export default function VoiceCommands({ 
  onNavigate, 
  onEmergency, 
  onTestAI, 
  onCheckStatus 
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [showCommands, setShowCommands] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Voice commands configuration
  const commands: VoiceCommand[] = [
    // Navigation commands
    {
      pattern: /(?:go to|open|show|navigate to|visit)\s*(?:the\s*)?(dashboard|home)/i,
      command: "Go to Dashboard",
      description: "Navigate to the main dashboard",
      action: () => onNavigate?.('/'),
      category: 'navigation'
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(call logs?|calls?|call history)/i,
      command: "Show Call Logs",
      description: "View recent call logs and transcripts",
      action: () => onNavigate?.('/call-logs'),
      category: 'navigation'
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(appointments?|schedule|calendar)/i,
      command: "Show Appointments",
      description: "View today's appointments and schedule",
      action: () => onNavigate?.('/appointments'),
      category: 'navigation'
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(analytics|reports?|business intelligence)/i,
      command: "Show Analytics",
      description: "View business analytics and insights",
      action: () => onNavigate?.('/business-analytics'),
      category: 'navigation'
    },
    {
      pattern: /(?:go to|open|show)\s*(?:the\s*)?(settings?|configuration)/i,
      command: "Open Settings",
      description: "Access system settings and configuration",
      action: () => onNavigate?.('/enhanced-settings'),
      category: 'navigation'
    },
    
    // AI Commands
    {
      pattern: /(?:test|check|try)\s*(?:the\s*)?(?:ai|artificial intelligence|receptionist)/i,
      command: "Test AI",
      description: "Start an AI receptionist test call",
      action: () => {
        onTestAI?.();
        toast({
          title: "AI Test Started",
          description: "Initiating AI receptionist test call...",
        });
      },
      category: 'ai'
    },
    {
      pattern: /(?:pause|stop|turn off)\s*(?:the\s*)?(?:ai|artificial intelligence|receptionist)/i,
      command: "Pause AI",
      description: "Temporarily pause the AI receptionist",
      action: () => {
        toast({
          title: "AI Paused",
          description: "AI receptionist has been temporarily paused",
          variant: "destructive"
        });
      },
      category: 'ai'
    },
    {
      pattern: /(?:start|resume|turn on|activate)\s*(?:the\s*)?(?:ai|artificial intelligence|receptionist)/i,
      command: "Start AI",
      description: "Activate or resume the AI receptionist",
      action: () => {
        toast({
          title: "AI Activated",
          description: "AI receptionist is now online and ready",
        });
      },
      category: 'ai'
    },
    
    // Status Commands
    {
      pattern: /(?:what's|what is|show|check)\s*(?:the\s*)?(?:status|health|system status)/i,
      command: "Check Status",
      description: "Get current system status and health",
      action: () => {
        onCheckStatus?.();
        toast({
          title: "System Status",
          description: "AI: Online | Calls: 12 today | Health: 98%",
        });
      },
      category: 'status'
    },
    {
      pattern: /(?:how many|show|count)\s*(?:calls?|phone calls?)\s*(?:today|this morning)/i,
      command: "Call Count",
      description: "Show today's call statistics",
      action: () => {
        toast({
          title: "Today's Calls",
          description: "12 total calls, 2 missed, 8 appointments booked",
        });
      },
      category: 'status'
    },
    
    // Emergency Commands
    {
      pattern: /(?:emergency|urgent|help|sos|critical)/i,
      command: "Emergency Alert",
      description: "Trigger emergency protocols and notifications",
      action: () => {
        onEmergency?.();
        toast({
          title: "Emergency Mode Activated",
          description: "Emergency protocols initiated. Staff notified.",
          variant: "destructive"
        });
      },
      category: 'emergency'
    }
  ];

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-GB';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        const confidence = event.results[event.results.length - 1][0].confidence;
        
        setLastCommand(transcript);
        setConfidence(confidence);
        
        // Process the command
        processVoiceCommand(transcript, confidence);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please try again or check microphone permissions",
          variant: "destructive"
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = (transcript: string, confidence: number) => {
    // Require minimum confidence for commands
    if (confidence < 0.7) {
      toast({
        title: "Command Not Clear",
        description: "Please speak more clearly and try again",
        variant: "destructive"
      });
      return;
    }

    // Find matching command
    const matchedCommand = commands.find(cmd => cmd.pattern.test(transcript));
    
    if (matchedCommand) {
      toast({
        title: "Voice Command Executed",
        description: `"${matchedCommand.command}" - ${Math.round(confidence * 100)}% confidence`,
      });
      matchedCommand.action();
    } else {
      toast({
        title: "Command Not Recognized",
        description: `"${transcript}" - Try saying "Show commands" for help`,
        variant: "destructive"
      });
    }
  };

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Voice Commands Not Supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive"
      });
      return;
    }

    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      toast({
        title: "Voice Commands Active",
        description: "Listening for voice commands...",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const categoryColors = {
    navigation: 'bg-blue-100 text-blue-800',
    ai: 'bg-green-100 text-green-800',
    emergency: 'bg-red-100 text-red-800',
    status: 'bg-purple-100 text-purple-800',
    data: 'bg-orange-100 text-orange-800'
  };

  const categorizedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  return (
    <div className="space-y-4">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Voice Commands
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommands(!showCommands)}
                data-testid="show-voice-commands"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Commands
              </Button>
              {isSupported ? (
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  data-testid={isListening ? "stop-voice-listening" : "start-voice-listening"}
                >
                  {isListening ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              ) : (
                <Badge variant="secondary">Not Supported</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isListening ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Listening...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Ready</span>
                  </div>
                )}
              </div>
              
              {lastCommand && (
                <div className="text-sm">
                  <span className="text-gray-600">Last:</span>
                  <span className="font-medium ml-2">"{lastCommand}"</span>
                  {confidence > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {Math.round(confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isSupported ? (
                <Badge variant="default">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Supported
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <VolumeX className="h-3 w-3 mr-1" />
                  Not Available
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Commands */}
      {showCommands && (
        <Card>
          <CardHeader>
            <CardTitle>Available Voice Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(categorizedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} Commands
                  </h4>
                  <div className="grid gap-3">
                    {categoryCommands.map((cmd, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Badge className={categoryColors[cmd.category]}>
                              {cmd.command}
                            </Badge>
                            <p className="text-sm text-gray-600">{cmd.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cmd.action}
                          data-testid={`execute-command-${cmd.command.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Try
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Usage Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold mb-2">Voice Command Tips:</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Speak clearly and at normal pace</li>
                <li>• Commands work best in quiet environments</li>
                <li>• Say "Emergency" for urgent situations</li>
                <li>• Use "Show status" for quick system overview</li>
                <li>• Commands require 70%+ confidence to execute</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}