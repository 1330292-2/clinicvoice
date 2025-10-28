import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Calendar, 
  TrendingUp, 
  Bell, 
  Settings,
  Play,
  Pause,
  Users,
  AlertTriangle,
  Activity,
  Menu,
  X
} from "lucide-react";

interface MobileStats {
  todayCalls: number;
  todayAppointments: number;
  aiStatus: 'online' | 'offline';
  missedCalls: number;
  systemHealth: number;
}

export default function MobileDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<MobileStats>({
    todayCalls: 12,
    todayAppointments: 8,
    aiStatus: 'online',
    missedCalls: 2,
    systemHealth: 98
  });

  const quickActions = [
    {
      id: 'test-call',
      title: 'Test AI',
      icon: Phone,
      color: 'bg-blue-500',
      action: () => console.log('Testing AI call')
    },
    {
      id: 'emergency',
      title: 'Emergency',
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: () => console.log('Emergency override')
    },
    {
      id: 'toggle-ai',
      title: stats.aiStatus === 'online' ? 'Pause AI' : 'Start AI',
      icon: stats.aiStatus === 'online' ? Pause : Play,
      color: stats.aiStatus === 'online' ? 'bg-yellow-500' : 'bg-green-500',
      action: () => setStats(prev => ({ 
        ...prev, 
        aiStatus: prev.aiStatus === 'online' ? 'offline' : 'online' 
      }))
    },
    {
      id: 'notifications',
      title: 'Alerts',
      icon: Bell,
      color: 'bg-purple-500',
      action: () => console.log('View notifications')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">ClinicVoice</h1>
            <p className="text-sm text-gray-600">Mobile Dashboard</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Navigation</h3>
            </div>
            <nav className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Logs
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Appointments
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* AI Status Card */}
        <Card className={stats.aiStatus === 'online' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${stats.aiStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <div>
                  <h3 className="font-semibold">AI Receptionist</h3>
                  <p className="text-sm text-gray-600">
                    {stats.aiStatus === 'online' ? 'Online & Ready' : 'Offline'}
                  </p>
                </div>
              </div>
              <Badge variant={stats.aiStatus === 'online' ? 'default' : 'destructive'}>
                {stats.aiStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Phone className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.todayCalls}</p>
              <p className="text-sm text-gray-600">Calls Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.todayAppointments}</p>
              <p className="text-sm text-gray-600">Appointments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.missedCalls}</p>
              <p className="text-sm text-gray-600">Missed Calls</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.systemHealth}%</p>
              <p className="text-sm text-gray-600">System Health</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={action.action}
                    data-testid={`mobile-action-${action.id}`}
                  >
                    <div className={`p-2 rounded-full ${action.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Appointment Booked</p>
                <p className="text-xs text-gray-600">Sarah J. - 2:00 PM Tuesday</p>
              </div>
              <Badge variant="outline" className="text-xs">5m ago</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
              <Phone className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Missed Call</p>
                <p className="text-xs text-gray-600">+44 7123 456789</p>
              </div>
              <Badge variant="outline" className="text-xs">12m ago</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Performance Update</p>
                <p className="text-xs text-gray-600">Response time improved 15%</p>
              </div>
              <Badge variant="outline" className="text-xs">1h ago</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button variant="ghost" className="flex flex-col items-center py-3">
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-3">
            <Phone className="h-5 w-5" />
            <span className="text-xs mt-1">Calls</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-3">
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Schedule</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-3">
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">Alerts</span>
          </Button>
        </div>
      </div>
    </div>
  );
}