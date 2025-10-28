import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { useToast } from "@/hooks/use-toast";

export default function VoiceFloatingButton() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening,
    lastCommand,
    confidence
  } = useVoiceCommands({
    enabled: true,
    onEmergency: () => {
      toast({
        title: "Emergency Alert",
        description: "Emergency protocols activated",
        variant: "destructive"
      });
    },
    onTestAI: () => {
      toast({
        title: "AI Test",
        description: "Testing AI receptionist",
      });
    }
  });

  if (!isSupported) {
    return null;
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`transition-all duration-300 ${isExpanded ? 'bg-white rounded-lg shadow-lg border p-3 w-64' : ''}`}>
        {isExpanded && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Voice Commands</h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {lastCommand && (
              <div className="text-xs bg-gray-50 p-2 rounded">
                <p className="font-medium">Last command:</p>
                <p className="text-gray-600 truncate">"{lastCommand}"</p>
                {confidence > 0 && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-600 space-y-1">
              <p>• "Go to dashboard"</p>
              <p>• "Show call logs"</p>
              <p>• "Emergency"</p>
              <p>• "Test AI"</p>
              <p>• "Check status"</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {isExpanded && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">
                {isListening ? 'Listening...' : 'Ready'}
              </span>
            </div>
          )}
          
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            onClick={handleToggleListening}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`rounded-full ${!isExpanded ? 'w-14 h-14' : ''} shadow-lg hover:shadow-xl transition-all`}
            data-testid="voice-floating-button"
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          {!isExpanded && isListening && (
            <div className="absolute -top-2 -right-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}