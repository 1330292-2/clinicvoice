import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Calendar, 
  Clock, 
  Smile,
  Users,
  Target,
  Activity,
  Download
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CallLog, Appointment } from "@shared/schema";

interface AnalyticsData {
  totalCalls: number;
  totalAppointments: number;
  conversionRate: number;
  avgCallDuration: number;
  satisfactionScore: number;
  callsByDay: { date: string; calls: number; appointments: number }[];
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  peakHours: { hour: number; calls: number }[];
  topServices: { service: string; count: number }[];
}

export default function Analytics() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");

  // Fetch raw data
  const { data: callLogs = [], isLoading: callLogsLoading, error: callLogsError } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
    retry: false,
  });

  const { data: appointments = [], isLoading: appointmentsLoading, error: appointmentsError } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    const error = callLogsError || appointmentsError;
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
  }, [callLogsError, appointmentsError, toast]);

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

  // Calculate analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    const now = new Date();
    const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = subDays(now, daysBack);

    // Filter data by time range
    const filteredCalls = callLogs.filter(call => 
      call.createdAt && new Date(call.createdAt) >= startDate
    );
    
    const filteredAppointments = appointments.filter(appointment => 
      appointment.createdAt && new Date(appointment.createdAt) >= startDate
    );

    // Basic metrics
    const totalCalls = filteredCalls.length;
    const totalAppointments = filteredAppointments.length;
    const appointmentsFromCalls = filteredCalls.filter(call => call.appointmentBooked).length;
    const conversionRate = totalCalls > 0 ? (appointmentsFromCalls / totalCalls) * 100 : 0;
    
    const avgCallDuration = filteredCalls.length > 0 
      ? filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / filteredCalls.length
      : 0;

    const validSentiments = filteredCalls.filter(call => call.sentimentScore !== null);
    const satisfactionScore = validSentiments.length > 0
      ? validSentiments.reduce((sum, call) => sum + (call.sentimentScore || 0), 0) / validSentiments.length
      : 0;

    // Calls by day
    const callsByDay = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayCalls = filteredCalls.filter(call => 
        call.createdAt && 
        new Date(call.createdAt) >= dayStart && 
        new Date(call.createdAt) <= dayEnd
      ).length;

      const dayAppointments = filteredCalls.filter(call => 
        call.createdAt && 
        new Date(call.createdAt) >= dayStart && 
        new Date(call.createdAt) <= dayEnd &&
        call.appointmentBooked
      ).length;

      callsByDay.push({
        date: format(date, "MMM d"),
        calls: dayCalls,
        appointments: dayAppointments
      });
    }

    // Sentiment distribution
    const sentimentDistribution = {
      positive: filteredCalls.filter(call => (call.sentimentScore || 0) > 0.3).length,
      neutral: filteredCalls.filter(call => 
        (call.sentimentScore || 0) <= 0.3 && (call.sentimentScore || 0) >= -0.3
      ).length,
      negative: filteredCalls.filter(call => (call.sentimentScore || 0) < -0.3).length,
    };

    // Peak hours (mock data based on typical patterns)
    const peakHours = [
      { hour: 9, calls: Math.floor(totalCalls * 0.15) },
      { hour: 10, calls: Math.floor(totalCalls * 0.12) },
      { hour: 11, calls: Math.floor(totalCalls * 0.10) },
      { hour: 14, calls: Math.floor(totalCalls * 0.13) },
      { hour: 15, calls: Math.floor(totalCalls * 0.11) },
      { hour: 16, calls: Math.floor(totalCalls * 0.09) },
    ].filter(h => h.calls > 0);

    // Top services (mock data)
    const topServices = [
      { service: "General Checkup", count: Math.floor(totalAppointments * 0.4) },
      { service: "Consultation", count: Math.floor(totalAppointments * 0.25) },
      { service: "Follow-up", count: Math.floor(totalAppointments * 0.20) },
      { service: "Emergency", count: Math.floor(totalAppointments * 0.15) },
    ].filter(s => s.count > 0);

    return {
      totalCalls,
      totalAppointments,
      conversionRate,
      avgCallDuration,
      satisfactionScore,
      callsByDay,
      sentimentDistribution,
      peakHours,
      topServices,
    };
  }, [callLogs, appointments, timeRange]);

  const handleExportData = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Calls', analyticsData.totalCalls.toString()],
      ['Total Appointments', analyticsData.totalAppointments.toString()],
      ['Conversion Rate', `${analyticsData.conversionRate.toFixed(1)}%`],
      ['Avg Call Duration', `${Math.round(analyticsData.avgCallDuration)}s`],
      ['Satisfaction Score', analyticsData.satisfactionScore.toFixed(1)],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const isDataLoading = callLogsLoading || appointmentsLoading;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Analytics" 
          description="Comprehensive insights into your clinic's call performance and patient interactions."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Calls</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analyticsData.totalCalls}
                        </p>
                        <p className="text-sm text-success mt-1 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {timeRange} period
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="text-primary h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Appointments</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analyticsData.totalAppointments}
                        </p>
                        <p className="text-sm text-success mt-1 flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          {analyticsData.conversionRate.toFixed(1)}% conversion
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="text-secondary h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Call Duration</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {Math.round(analyticsData.avgCallDuration)}s
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Per call average
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Activity className="text-accent h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analyticsData.satisfactionScore > 0 
                            ? (analyticsData.satisfactionScore * 2 + 3).toFixed(1)
                            : "N/A"
                          }
                        </p>
                        <p className="text-sm text-success mt-1 flex items-center">
                          <Smile className="h-3 w-3 mr-1" />
                          Patient rating
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                        <Users className="text-warning h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calls Over Time */}
                <Card className="border border-gray-100">
                  <CardHeader>
                    <CardTitle>Calls & Appointments Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.callsByDay.length > 0 ? (
                      <div className="space-y-4">
                        {analyticsData.callsByDay.slice(-7).map((day, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700 w-16">
                              {day.date}
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="flex space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: analyticsData.totalCalls > 0 
                                        ? `${(day.calls / Math.max(...analyticsData.callsByDay.map(d => d.calls))) * 100}%`
                                        : '0%'
                                    }}
                                  />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-secondary h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: analyticsData.totalCalls > 0 
                                        ? `${(day.appointments / Math.max(...analyticsData.callsByDay.map(d => d.appointments || 0))) * 100}%`
                                        : '0%'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 w-20 text-right">
                              {day.calls}c / {day.appointments}a
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                            <span>Calls</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-secondary rounded-full" />
                            <span>Appointments</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No data available for the selected period
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card className="border border-gray-100">
                  <CardHeader>
                    <CardTitle>Patient Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.totalCalls > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-success rounded-full" />
                            <span className="text-sm font-medium">Positive</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600">
                              {analyticsData.sentimentDistribution.positive}
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-success h-2 rounded-full"
                                style={{
                                  width: `${(analyticsData.sentimentDistribution.positive / analyticsData.totalCalls) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-warning rounded-full" />
                            <span className="text-sm font-medium">Neutral</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600">
                              {analyticsData.sentimentDistribution.neutral}
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-warning h-2 rounded-full"
                                style={{
                                  width: `${(analyticsData.sentimentDistribution.neutral / analyticsData.totalCalls) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-error rounded-full" />
                            <span className="text-sm font-medium">Negative</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600">
                              {analyticsData.sentimentDistribution.negative}
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-error h-2 rounded-full"
                                style={{
                                  width: `${(analyticsData.sentimentDistribution.negative / analyticsData.totalCalls) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No sentiment data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <Card className="border border-gray-100">
                  <CardHeader>
                    <CardTitle>Peak Call Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.peakHours.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.peakHours.map((hour, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">
                              {hour.hour}:00 - {hour.hour + 1}:00
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-gray-600">{hour.calls}</div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{
                                    width: `${(hour.calls / Math.max(...analyticsData.peakHours.map(h => h.calls))) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No peak hour data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Services */}
                <Card className="border border-gray-100">
                  <CardHeader>
                    <CardTitle>Most Requested Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.topServices.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.topServices.map((service, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">
                              {service.service}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-gray-600">{service.count}</div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-secondary h-2 rounded-full"
                                  style={{
                                    width: `${(service.count / Math.max(...analyticsData.topServices.map(s => s.count))) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No service data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
