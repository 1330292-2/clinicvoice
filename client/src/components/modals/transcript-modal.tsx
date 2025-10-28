import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smile, Meh, Frown, Bot, User, CalendarCheck, Download } from "lucide-react";
import { format } from "date-fns";
import type { CallLog } from "@shared/schema";

interface TranscriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callLog: CallLog | null;
}

export default function TranscriptModal({ open, onOpenChange, callLog }: TranscriptModalProps) {
  if (!callLog) return null;

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleDownload = () => {
    if (!callLog.transcript) return;
    
    const content = `Call Transcript
Phone: ${callLog.callerPhone}
Duration: ${formatDuration(callLog.duration)}
Date: ${callLog.createdAt ? format(new Date(callLog.createdAt), "PPpp") : "Unknown"}

Transcript:
${callLog.transcript}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-transcript-${callLog.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse transcript into conversation if it's structured
  const parseTranscript = (transcript: string | null) => {
    if (!transcript) return [];
    
    // Simple parsing - in real app, this would be more sophisticated
    const lines = transcript.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: index,
      speaker: index % 2 === 0 ? 'ai' : 'caller',
      message: line.trim(),
      timestamp: new Date(Date.now() - (lines.length - index) * 30000), // Mock timestamps
    }));
  };

  const conversation = parseTranscript(callLog.transcript);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Call Transcript</DialogTitle>
          <div className="text-sm text-gray-500 space-x-2">
            <span>{callLog.callerPhone}</span>
            <span>•</span>
            <span>{formatDuration(callLog.duration)}</span>
            <span>•</span>
            <span>
              {callLog.createdAt 
                ? format(new Date(callLog.createdAt), "PPp") 
                : "Unknown time"
              }
            </span>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 space-y-4 py-4">
          {conversation.length > 0 ? (
            conversation.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.speaker === 'ai' 
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}>
                  {message.speaker === 'ai' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`rounded-lg p-3 ${
                    message.speaker === 'ai' 
                      ? 'bg-gray-50'
                      : 'bg-blue-50'
                  }`}>
                    <p className="text-sm text-gray-900">{message.message}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(message.timestamp, "h:mm:ss a")}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {callLog.transcript ? callLog.transcript : "No transcript available for this call."}
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getSentimentIcon(callLog.sentimentScore)}
                <span className="text-gray-600">
                  Sentiment: {getSentimentText(callLog.sentimentScore)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarCheck className={`h-4 w-4 ${
                  callLog.appointmentBooked ? 'text-success' : 'text-gray-400'
                }`} />
                <span className="text-gray-600">
                  Appointment Booked: {callLog.appointmentBooked ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            {callLog.transcript && (
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
