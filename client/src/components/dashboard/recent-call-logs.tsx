import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Smile, Meh, Frown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import type { CallLog } from "@shared/schema";

interface RecentCallLogsProps {
  onViewTranscript: (callLog: CallLog) => void;
  clinic?: any; // Add clinic prop
}

export default function RecentCallLogs({ onViewTranscript, clinic }: RecentCallLogsProps) {
  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
    enabled: !!clinic, // Only fetch if clinic exists
  });

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

  const recentCallLogs = callLogs.slice(0, 10);

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Recent Call Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentCallLogs.length === 0) {
    return (
      <Card className="lg:col-span-2 border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Call Logs</CardTitle>
            <Link href="/call-logs">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No call logs found. Calls will appear here once received.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Call Logs</CardTitle>
          <Link href="/call-logs">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
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
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentCallLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.createdAt ? format(new Date(log.createdAt), "h:mm a") : "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.callerPhone}
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.appointmentBooked ? "Appointment booked" : "General inquiry"}
                    </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTranscript(log)}
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
    </Card>
  );
}
