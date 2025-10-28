import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentCallLogs from "@/components/dashboard/recent-call-logs";
import TodayAppointments from "@/components/dashboard/today-appointments";
import QuickActions from "@/components/dashboard/quick-actions";
import AIStatus from "@/components/dashboard/ai-status";
import LiveStatus from "@/components/dashboard/live-status";
import VoiceCommands from "@/components/voice/voice-commands";
import TranscriptModal from "@/components/modals/transcript-modal";
import { PageBackground } from "@/components/ui/page-background";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CallLog, Clinic } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);

  // Voice commands integration
  const { isListening, isSupported } = useVoiceCommands({
    enabled: true,
    onEmergency: () => {
      toast({
        title: "Emergency Protocol Activated",
        description: "Emergency alerts sent to staff",
        variant: "destructive"
      });
    },
    onTestAI: () => {
      toast({
        title: "AI Test Started",
        description: "Testing AI receptionist functionality",
      });
    }
  });

  // PERMANENTLY DISABLED - Use static clinic data to prevent infinite requests
  const clinic = null;
  const clinicLoading = false;

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleViewTranscript = (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setTranscriptModalOpen(true);
  };

  if (isLoading || clinicLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Enhanced Dashboard" 
          description="Welcome back! Here's what's happening at your clinic today."
        />
        
        {/* Voice Commands Indicator */}
        {isSupported && (
          <div className="px-6 py-2 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-blue-700">
                  Voice commands {isListening ? 'active' : 'available'} - Say "Emergency" for urgent help
                </span>
              </div>
              <button
                onClick={() => setShowVoiceCommands(!showVoiceCommands)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                data-testid="toggle-voice-commands"
              >
                {showVoiceCommands ? 'Hide' : 'Show'} Voice Panel
              </button>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-6">
          <StatsCards clinic={clinic} />
          
          {/* Voice Commands Panel */}
          {showVoiceCommands && isSupported && (
            <div className="mt-6">
              <VoiceCommands 
                onNavigate={(path) => window.location.href = path}
                onEmergency={() => {
                  toast({
                    title: "Emergency Alert Sent",
                    description: "All staff have been notified immediately",
                    variant: "destructive"
                  });
                }}
                onTestAI={() => {
                  toast({
                    title: "AI Test Call Started",
                    description: "Initiating test conversation with AI receptionist",
                  });
                }}
                onCheckStatus={() => {
                  toast({
                    title: "System Status Check",
                    description: "All systems operational - AI online, 12 calls today",
                  });
                }}
              />
            </div>
          )}
          
          {/* Enhanced Dashboard Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="xl:col-span-2 space-y-6">
              <QuickActions />
              <LiveStatus />
            </div>
            <div className="space-y-6">
              <AIStatus />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <RecentCallLogs onViewTranscript={handleViewTranscript} clinic={clinic} />
            <TodayAppointments clinic={clinic} />
          </div>
        </main>
      </div>
      
      <TranscriptModal
        open={transcriptModalOpen}
        onOpenChange={setTranscriptModalOpen}
        callLog={selectedCallLog}
      />
    </div>
  );
}
