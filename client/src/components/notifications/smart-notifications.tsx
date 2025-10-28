import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Phone, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  X,
  Settings
} from "lucide-react";

interface Notification {
  id: string;
  type: 'missed_call' | 'appointment_booked' | 'performance_alert' | 'system_update' | 'revenue_milestone' | 'emergency';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  data?: any;
}

interface NotificationSettings {
  missedCalls: boolean;
  appointments: boolean;
  performance: boolean;
  system: boolean;
  revenue: boolean;
  emergency: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function SmartNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "missed_call",
      title: "Missed Call Alert",
      message: "Caller +44 7123 456789 couldn't reach you during business hours",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      priority: "high",
      actionRequired: true,
      data: { phone: "+44 7123 456789", attempts: 2 }
    },
    {
      id: "2",
      type: "appointment_booked",
      title: "New Appointment Booked",
      message: "Sarah Johnson scheduled for Tuesday 2:00 PM - General checkup",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: "medium",
      actionRequired: false,
      data: { patientName: "Sarah Johnson", date: "Tuesday 2:00 PM" }
    },
    {
      id: "3",
      type: "performance_alert",
      title: "AI Performance Improvement",
      message: "Response time improved by 15% - patient satisfaction up 8%",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      priority: "low",
      actionRequired: false,
      data: { improvement: "15%", satisfaction: "8%" }
    },
    {
      id: "4",
      type: "revenue_milestone",
      title: "Monthly Savings Milestone",
      message: "You've saved £1,500 this month with ClinicVoice AI",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      priority: "medium",
      actionRequired: false,
      data: { savings: "£1,500" }
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    missedCalls: true,
    appointments: true,
    performance: true,
    system: true,
    revenue: true,
    emergency: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const [showSettings, setShowSettings] = useState(false);

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: "system_update",
          title: "System Health Check",
          message: "All systems running optimally - 99.8% uptime",
          timestamp: new Date(),
          priority: "low",
          actionRequired: false
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'missed_call': return Phone;
      case 'appointment_booked': return Calendar;
      case 'performance_alert': return TrendingUp;
      case 'system_update': return Activity;
      case 'revenue_milestone': return DollarSign;
      case 'emergency': return AlertTriangle;
      default: return Bell;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;

  return (
    <div className="space-y-6">
      {/* Notification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Smart Notifications
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              <p className="text-sm text-gray-600">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{actionRequiredCount}</p>
              <p className="text-sm text-gray-600">Action Required</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">98%</p>
              <p className="text-sm text-gray-600">Response Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">2.3s</p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </div>

          {/* Notification Settings */}
          {showSettings && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Missed Calls</label>
                      <Switch
                        checked={settings.missedCalls}
                        onCheckedChange={(checked) => updateSetting('missedCalls', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Appointments</label>
                      <Switch
                        checked={settings.appointments}
                        onCheckedChange={(checked) => updateSetting('appointments', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Performance Alerts</label>
                      <Switch
                        checked={settings.performance}
                        onCheckedChange={(checked) => updateSetting('performance', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">System Updates</label>
                      <Switch
                        checked={settings.system}
                        onCheckedChange={(checked) => updateSetting('system', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Revenue Milestones</label>
                      <Switch
                        checked={settings.revenue}
                        onCheckedChange={(checked) => updateSetting('revenue', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Emergency Alerts</label>
                      <Switch
                        checked={settings.emergency}
                        onCheckedChange={(checked) => updateSetting('emergency', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">SMS Notifications</label>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No new notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${getNotificationColor(notification.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={getPriorityBadgeColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            {notification.actionRequired && (
                              <Badge variant="outline">Action Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.data && (
                              <span>•</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {notification.actionRequired && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="default">
                            Take Action
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intelligent Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Intelligent Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Peak Hours Detected</h4>
              <p className="text-sm text-blue-700">
                Your busiest calling hours are 9-11 AM and 2-4 PM. Consider optimizing AI response speed during these times.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Cost Savings Alert</h4>
              <p className="text-sm text-green-700">
                This month's AI efficiency has saved you approximately £1,250 compared to traditional staffing.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Optimization Opportunity</h4>
              <p className="text-sm text-yellow-700">
                Voice clarity can be improved by 12% with minor adjustments to the speech synthesis settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}