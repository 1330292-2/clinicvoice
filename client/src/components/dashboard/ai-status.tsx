import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Volume2, 
  Phone, 
  Zap, 
  TrendingUp, 
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Activity
} from "lucide-react";

interface AIMetrics {
  responseTime: number;
  accuracy: number;
  confidence: number;
  voiceClarity: number;
  conversationFlow: number;
  learningProgress: number;
}

interface AIConfiguration {
  personality: string;
  responseSpeed: string;
  voiceType: string;
  language: string;
  isActive: boolean;
  lastOptimized: Date;
}

export default function AIStatus() {
  const [aiMetrics, setAIMetrics] = useState<AIMetrics>({
    responseTime: 85,
    accuracy: 92,
    confidence: 88,
    voiceClarity: 95,
    conversationFlow: 90,
    learningProgress: 76
  });

  const [aiConfig, setAIConfig] = useState<AIConfiguration>({
    personality: "Professional & Empathetic",
    responseSpeed: "Moderate",
    voiceType: "British Female (Sarah)",
    language: "English (UK)",
    isActive: true,
    lastOptimized: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAIMetrics(prev => ({
        responseTime: Math.min(100, prev.responseTime + (Math.random() - 0.5) * 2),
        accuracy: Math.min(100, Math.max(85, prev.accuracy + (Math.random() - 0.5) * 1)),
        confidence: Math.min(100, Math.max(80, prev.confidence + (Math.random() - 0.5) * 1.5)),
        voiceClarity: Math.min(100, Math.max(90, prev.voiceClarity + (Math.random() - 0.5) * 0.5)),
        conversationFlow: Math.min(100, Math.max(85, prev.conversationFlow + (Math.random() - 0.5) * 1)),
        learningProgress: Math.min(100, prev.learningProgress + Math.random() * 0.1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setAIConfig(prev => ({ ...prev, lastOptimized: new Date() }));
    setIsOptimizing(false);
  };

  const toggleAI = () => {
    setAIConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const getStatusColor = (value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatLastOptimized = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* AI Status Overview */}
      <Card className={aiConfig.isActive ? "border-green-200 bg-green-50" : "border-gray-200"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-6 w-6 mr-2" />
              AI Receptionist Status
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={aiConfig.isActive ? "default" : "secondary"}>
                {aiConfig.isActive ? "Online" : "Offline"}
              </Badge>
              <div className={`w-3 h-3 rounded-full ${aiConfig.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Personality</label>
                <p className="text-lg">{aiConfig.personality}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Voice</label>
                <p className="text-lg flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  {aiConfig.voiceType}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Response Speed</label>
                <p className="text-lg">{aiConfig.responseSpeed}</p>
              </div>
            </div>
            
            <div className="flex flex-col justify-center space-y-3">
              <Button
                onClick={toggleAI}
                variant={aiConfig.isActive ? "destructive" : "default"}
                className="w-full"
                data-testid="toggle-ai-button"
              >
                {aiConfig.isActive ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause AI
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Activate AI
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleOptimize}
                variant="outline"
                disabled={isOptimizing}
                className="w-full"
                data-testid="optimize-ai-button"
              >
                {isOptimizing ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize AI
                  </>
                )}
              </Button>
              
              <Button variant="outline" className="w-full" data-testid="configure-ai-button">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Last optimized: {formatLastOptimized(aiConfig.lastOptimized)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Response Time</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.responseTime)}`}>
                      {aiMetrics.responseTime.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.responseTime)}`}
                      style={{ width: `${aiMetrics.responseTime}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Accuracy</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.accuracy)}`}>
                      {aiMetrics.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.accuracy)}`}
                      style={{ width: `${aiMetrics.accuracy}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Confidence</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.confidence)}`}>
                      {aiMetrics.confidence.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.confidence)}`}
                      style={{ width: `${aiMetrics.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Voice Clarity</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.voiceClarity)}`}>
                      {aiMetrics.voiceClarity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.voiceClarity)}`}
                      style={{ width: `${aiMetrics.voiceClarity}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Conversation Flow</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.conversationFlow)}`}>
                      {aiMetrics.conversationFlow.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.conversationFlow)}`}
                      style={{ width: `${aiMetrics.conversationFlow}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Learning Progress</label>
                    <span className={`text-sm font-bold ${getStatusColor(aiMetrics.learningProgress)}`}>
                      {aiMetrics.learningProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(aiMetrics.learningProgress)}`}
                      style={{ width: `${aiMetrics.learningProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Performance Score */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Overall Performance</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {((aiMetrics.responseTime + aiMetrics.accuracy + aiMetrics.confidence + 
                       aiMetrics.voiceClarity + aiMetrics.conversationFlow + aiMetrics.learningProgress) / 6).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={(aiMetrics.responseTime + aiMetrics.accuracy + aiMetrics.confidence + 
                        aiMetrics.voiceClarity + aiMetrics.conversationFlow + aiMetrics.learningProgress) / 6} 
                className="w-full h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Voice Training Opportunity</p>
                <p className="text-xs text-blue-700">Recent calls show 15% improvement potential in elderly patient interactions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Response Speed Adjustment</p>
                <p className="text-xs text-yellow-700">Consider slowing response speed during busy hours for better accuracy</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Phone className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Conversation Flow Optimized</p>
                <p className="text-xs text-green-700">Emergency protocol handling improved by 8% this week</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}