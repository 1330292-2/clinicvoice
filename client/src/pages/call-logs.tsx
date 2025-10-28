import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TranscriptModal from "@/components/modals/transcript-modal";
import { Eye, Smile, Meh, Frown, Search } from "lucide-react";
import { format } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CallLog } from "@shared/schema";

export default function CallLogs() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: callLogs = [], isLoading: logsLoading, error } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const getSentimentIcon = (score: number | null) => {
    if (score === null) return <Meh className="h-4 w-4 text-gray-400" />;
    if (score > 0.3) return <Smile className="h-4 w-4 text-success" />;
    if (score < -0.3) return <Frown className="h-4 w-4 text-error" />;
    return <Meh className="h-4 w-4 text-warning" />;
  };

  const getSentimentText = (score: number | null) => {
    if (score === null) return "Unknown";
    if (score > 0.3) return "Positive";
    if (score < -0.3) return "Negative";
    return "Neutral";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-success/10 text-success";
      case "booked":
        return "bg-success/10 text-success";
      case "escalated":
        return "bg-error/10 text-error";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleViewTranscript = (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setTranscriptModalOpen(true);
  };

  // Filter call logs based on search term
  const filteredCallLogs = callLogs.filter(log =>
    log.callerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.transcript && log.transcript.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
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
          title="Call Logs" 
          description="View and manage all incoming calls to your clinic."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle>All Call Logs</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search calls..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            {logsLoading ? (
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            ) : filteredCallLogs.length === 0 ? (
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm ? "No call logs match your search." : "No call logs found. Calls will appear here once received."}
                  </p>
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCallLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.createdAt ? format(new Date(log.createdAt), "MMM d, h:mm a") : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {log.callerPhone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(log.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(log.callStatus || "unknown")}>
                            {log.callStatus || "Unknown"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getSentimentIcon(log.sentimentScore)}
                            <span className="text-sm text-gray-900">
                              {getSentimentText(log.sentimentScore)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={log.appointmentBooked ? "default" : "secondary"}>
                            {log.appointmentBooked ? "Booked" : "No"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTranscript(log)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
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
