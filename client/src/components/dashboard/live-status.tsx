import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Users,
  Calendar,
  Activity
} from "lucide-react";

interface LiveCall {
  id: string;
  callerPhone: string;
  status: 'ringing' | 'active' | 'on_hold';
  duration: number;
  intent: string;
}

interface SystemStatus {
  aiOnline: boolean;
  phoneSystemOnline: boolean;
  lastHealthCheck: Date;
  todayCalls: number;
  todayAppointments: number;
  avgCallDuration: number;
}

export default function LiveStatus() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    aiOnline: true,
    phoneSystemOnline: true,
    lastHealthCheck: new Date(),
    todayCalls: 12,
    todayAppointments: 8,
    avgCallDuration: 180
  });

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update call durations
      setLiveCalls(prev => prev.map(call => ({
        ...call,
        duration: call.duration + 1
      })));
      
      // Update system metrics
      setSystemStatus(prev => ({
        ...prev,
        lastHealthCheck: new Date()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'on_hold': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ringing': return 'Incoming';
      case 'active': return 'Active';
      case 'on_hold': return 'On Hold';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${systemStatus.aiOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <div>
                <p className="text-sm font-medium">AI System</p>
                <p className="text-xs text-gray-600">
                  {systemStatus.aiOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{systemStatus.todayCalls}</p>
                <p className="text-xs text-gray-600">Calls Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{systemStatus.todayAppointments}</p>
                <p className="text-xs text-gray-600">Bookings Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{Math.round(systemStatus.avgCallDuration / 60)}m</p>
                <p className="text-xs text-gray-600">Avg Call Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PhoneCall className="h-5 w-5 mr-2" />
            Live Calls
            {liveCalls.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {liveCalls.length} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveCalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active calls</p>
              <p className="text-sm">Your AI is ready to handle incoming calls</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)} animate-pulse`}></div>
                    <div>
                      <p className="font-medium">{call.callerPhone}</p>
                      <p className="text-sm text-gray-600">{call.intent}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      {getStatusText(call.status)}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">{formatDuration(call.duration)}</p>
                      <p className="text-xs text-gray-600">Duration</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Monitor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Phone className="h-5 w-5" />
              <span className="text-sm">Test Call</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Health Check</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Staff Alert</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Performance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Missed Call</p>
                <p className="text-xs text-yellow-700">+44 7123 456789 - Unable to reach after-hours</p>
                <p className="text-xs text-yellow-600">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Appointment Booked</p>
                <p className="text-xs text-green-700">Sarah Johnson - Tuesday 2 PM</p>
                <p className="text-xs text-green-600">5 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">System Update</p>
                <p className="text-xs text-blue-700">AI response time improved by 15%</p>
                <p className="text-xs text-blue-600">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}