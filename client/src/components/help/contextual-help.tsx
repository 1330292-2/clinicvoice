import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, 
  Send, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface HelpMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

interface ContextualHelpProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function ContextualHelp({ isMinimized = false, onToggleMinimize }: ContextualHelpProps) {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextSuggestions, setContextSuggestions] = useState<string[]>([]);

  // Get contextual information based on current page
  const getPageContext = () => {
    const contexts = {
      '/': 'Dashboard - Analytics and overview',
      '/call-logs': 'Call Logs - Managing phone interactions',
      '/appointments': 'Appointments - Scheduling and booking',
      '/simulations': 'AI Simulations - Testing receptionist features',
      '/ai-config': 'AI Configuration - Customizing AI behavior',
      '/settings': 'Settings - Platform configuration',
      '/analytics': 'Analytics - Performance metrics'
    };
    return contexts[location as keyof typeof contexts] || 'ClinicVoice Platform';
  };

  // Generate contextual suggestions based on current page
  useEffect(() => {
    const suggestions = {
      '/': [
        "How do I interpret the dashboard metrics?",
        "What do the different status indicators mean?",
        "How can I improve call handling performance?"
      ],
      '/call-logs': [
        "How do I review call transcripts?",
        "What should I look for in call quality?",
        "How can I export call data?"
      ],
      '/appointments': [
        "How does the booking system work?",
        "Can patients book outside business hours?",
        "How do I handle appointment cancellations?"
      ],
      '/simulations': [
        "Which simulation should I start with?",
        "How realistic are these test scenarios?",
        "Can I customize the simulation parameters?"
      ],
      '/ai-config': [
        "How do I adjust the AI personality?",
        "What are the best practice settings?",
        "How do I handle medical emergencies?"
      ],
      '/settings': [
        "How do I integrate with my existing systems?",
        "What are the security best practices?",
        "How do I backup my configuration?"
      ]
    };

    setContextSuggestions(suggestions[location as keyof typeof suggestions] || [
      "How does ClinicVoice work?",
      "What features are available?",
      "How do I get started?"
    ]);
  }, [location]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: HelpMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
      context: getPageContext()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual Perplexity API call when key is available
      const response = await fetch('/api/help/contextual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: getPageContext(),
          page: location
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: HelpMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get help response');
      }
    } catch (error) {
      const errorMessage: HelpMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm currently setting up the AI help system. For now, here are some helpful resources:\n\n" +
                "• Check the sidebar navigation for different features\n" +
                "• Try the AI Simulations to test system functionality\n" +
                "• Visit Settings to configure your clinic preferences\n" +
                "• The Dashboard shows real-time analytics and status",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-lg"
          data-testid="help-expand-button"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-900">AI Help Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            {getPageContext().split(' - ')[0]}
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="help-toggle-expand"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            data-testid="help-minimize-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-col h-96">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">
                  Welcome! I'm your AI assistant for {getPageContext().split(' - ')[0]}.
                </p>
                <p className="text-gray-400 text-xs">
                  Ask me anything about this page or select a suggestion below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Suggestions */}
          {contextSuggestions.length > 0 && messages.length === 0 && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
              <div className="space-y-2">
                {contextSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-2 text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`help-suggestion-${index}`}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <Input
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Ask me anything..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(currentQuestion)}
                disabled={isLoading}
                className="text-sm"
                data-testid="help-input"
              />
              <Button
                onClick={() => handleSendMessage(currentQuestion)}
                disabled={isLoading || !currentQuestion.trim()}
                size="sm"
                data-testid="help-send-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="p-4">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Need help with {getPageContext().split(' - ')[0]}?
            </p>
            <Button
              onClick={() => setIsExpanded(true)}
              size="sm"
              className="w-full"
              data-testid="help-expand-chat"
            >
              Start Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}