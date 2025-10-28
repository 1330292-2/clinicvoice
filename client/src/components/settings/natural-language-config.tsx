import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Volume2, 
  Clock, 
  Heart, 
  Zap, 
  PlayCircle,
  Save,
  RotateCcw,
  Sparkles
} from "lucide-react";

interface ConfigSuggestion {
  id: string;
  prompt: string;
  description: string;
  category: 'personality' | 'speed' | 'voice' | 'behavior';
  icon: any;
}

interface VoicePreview {
  id: string;
  name: string;
  accent: string;
  gender: string;
  sample: string;
}

export default function NaturalLanguageConfig() {
  const [naturalInput, setNaturalInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("british-female-sarah");
  const [currentConfig, setCurrentConfig] = useState({
    personality: "Professional and empathetic",
    responseSpeed: "Moderate pace",
    voiceType: "British Female (Sarah)",
    specialInstructions: "Handle elderly patients with extra care and patience"
  });

  const suggestions: ConfigSuggestion[] = [
    {
      id: "friendly",
      prompt: "Make my AI more friendly and welcoming",
      description: "Increases warmth and empathy in responses",
      category: "personality",
      icon: Heart
    },
    {
      id: "faster",
      prompt: "Speed up responses for busy periods",
      description: "Reduces response time and conversation length",
      category: "speed",
      icon: Zap
    },
    {
      id: "professional",
      prompt: "Be more formal and professional",
      description: "Uses clinical terminology and formal language",
      category: "personality",
      icon: MessageSquare
    },
    {
      id: "elderly",
      prompt: "Speak slower for elderly patients",
      description: "Adjusts pace and volume for better comprehension",
      category: "behavior",
      icon: Clock
    },
    {
      id: "emergency",
      prompt: "Handle emergencies with priority",
      description: "Recognizes urgent situations and escalates quickly",
      category: "behavior",
      icon: Zap
    },
    {
      id: "voice-calm",
      prompt: "Use a calming, soothing voice",
      description: "Adjusts tone and pace for anxious patients",
      category: "voice",
      icon: Volume2
    }
  ];

  const voicePreviews: VoicePreview[] = [
    {
      id: "british-female-sarah",
      name: "Sarah",
      accent: "British",
      gender: "Female",
      sample: "Good morning, this is Sarah from the clinic. How may I help you today?"
    },
    {
      id: "british-male-james",
      name: "James",
      accent: "British",
      gender: "Male",
      sample: "Hello, this is James. I'd be happy to help you schedule an appointment."
    },
    {
      id: "american-female-emma",
      name: "Emma",
      accent: "American",
      gender: "Female",
      sample: "Hi there! This is Emma from your healthcare provider. What can I do for you?"
    },
    {
      id: "american-male-david",
      name: "David",
      accent: "American",
      gender: "Male",
      sample: "Good afternoon, this is David. I'm here to assist with your healthcare needs."
    }
  ];

  const handleNaturalInput = async () => {
    if (!naturalInput.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock configuration update based on input
    const input = naturalInput.toLowerCase();
    let newConfig = { ...currentConfig };
    
    if (input.includes('friendly') || input.includes('warm')) {
      newConfig.personality = "Warm and friendly";
    }
    if (input.includes('professional') || input.includes('formal')) {
      newConfig.personality = "Professional and formal";
    }
    if (input.includes('fast') || input.includes('quick')) {
      newConfig.responseSpeed = "Fast and efficient";
    }
    if (input.includes('slow') || input.includes('patient')) {
      newConfig.responseSpeed = "Slow and patient";
    }
    if (input.includes('elderly') || input.includes('older')) {
      newConfig.specialInstructions = "Extra patience for elderly patients, speak clearly and slowly";
    }
    if (input.includes('emergency') || input.includes('urgent')) {
      newConfig.specialInstructions = "Prioritize emergency situations and escalate immediately";
    }
    
    setCurrentConfig(newConfig);
    setIsProcessing(false);
    setNaturalInput("");
  };

  const applySuggestion = (suggestion: ConfigSuggestion) => {
    setNaturalInput(suggestion.prompt);
  };

  const playVoicePreview = (voiceId: string) => {
    const voice = voicePreviews.find(v => v.id === voiceId);
    if (voice) {
      // In a real implementation, this would play the actual voice sample
      console.log(`Playing voice preview: ${voice.sample}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Natural Language Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Configure AI with Natural Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="natural-input">Tell your AI how to behave</Label>
            <div className="flex space-x-2 mt-2">
              <Textarea
                id="natural-input"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                placeholder="e.g., 'Make my AI more friendly and patient with elderly callers'"
                className="flex-1"
                rows={3}
                data-testid="natural-language-input"
              />
              <Button
                onClick={handleNaturalInput}
                disabled={isProcessing || !naturalInput.trim()}
                className="px-6"
                data-testid="apply-config-button"
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div>
            <Label>Quick Suggestions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    className="h-auto p-3 justify-start"
                    onClick={() => applySuggestion(suggestion)}
                    data-testid={`suggestion-${suggestion.id}`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{suggestion.prompt}</p>
                      <p className="text-xs text-gray-600">{suggestion.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Current AI Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Personality</Label>
              <p className="text-lg">{currentConfig.personality}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Response Speed</Label>
              <p className="text-lg">{currentConfig.responseSpeed}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Voice Type</Label>
              <p className="text-lg">{currentConfig.voiceType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Special Instructions</Label>
              <p className="text-lg">{currentConfig.specialInstructions}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4 border-t">
            <Button data-testid="save-config-button">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" data-testid="test-config-button">
              <PlayCircle className="h-4 w-4 mr-2" />
              Test Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection with Previews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Voice Selection & Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voicePreviews.map((voice) => (
              <div
                key={voice.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedVoice === voice.id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedVoice(voice.id)}
                data-testid={`voice-option-${voice.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{voice.name}</p>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{voice.accent}</Badge>
                      <Badge variant="outline">{voice.gender}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(voice.id);
                    }}
                    data-testid={`play-voice-${voice.id}`}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 italic">"{voice.sample}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Behavior Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Example Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Appointment Booking</h4>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <Badge variant="secondary" className="mr-3">Caller</Badge>
                  <p>"I need to book an appointment for next week."</p>
                </div>
                <div className="flex">
                  <Badge variant="default" className="mr-3">AI</Badge>
                  <p className="italic">"I'd be happy to help you schedule an appointment. May I have your name and preferred day?"</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Emergency Situation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <Badge variant="secondary" className="mr-3">Caller</Badge>
                  <p>"I'm having chest pains right now!"</p>
                </div>
                <div className="flex">
                  <Badge variant="destructive" className="mr-3">AI</Badge>
                  <p className="italic">"This sounds urgent. I'm immediately connecting you to our emergency line. Please hold while I get you help right away."</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}