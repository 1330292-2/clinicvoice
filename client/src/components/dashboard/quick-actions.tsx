import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Clinic } from "@shared/schema";
import { 
  Phone, 
  TestTube, 
  Settings, 
  Users, 
  Calendar, 
  BarChart3,
  AlertTriangle,
  Download,
  PlayCircle,
  Zap,
  Clock,
  Shield
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency' | 'daily' | 'admin';
}

export default function QuickActions() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();

  // Fetch user's clinic
  const { data: clinic } = useQuery<Clinic | null>({
    queryKey: ["/api/clinic"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Make call mutation
  const makeCallMutation = useMutation({
    mutationFn: async ({ to }: { to: string }) => {
      if (!clinic || !clinic.id) {
        throw new Error("No clinic found for user");
      }
      const response = await apiRequest("POST", "/api/twilio/make-call", { 
        clinicId: clinic.id, 
        to 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Call Initiated",
        description: `Call started successfully to ${data.to}. Call ID: ${data.callSid}`,
      });
      setCallDialogOpen(false);
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error?.message || "Failed to initiate call",
        variant: "destructive",
      });
    },
  });

  const validatePhoneNumber = (phone: string): boolean => {
    // E.164 format validation: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const handleMakeCall = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number in E.164 format (e.g., +441234567890)",
        variant: "destructive",
      });
      return;
    }

    makeCallMutation.mutate({ to: phoneNumber });
  };

  const handleAction = async (actionId: string, action: () => void) => {
    setIsLoading(actionId);
    try {
      await action();
    } finally {
      setTimeout(() => setIsLoading(null), 1000);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "test-call",
      title: "Test AI Call",
      description: "Quick AI verification test",
      icon: Phone,
      priority: "high",
      category: "daily",
      action: () => setCallDialogOpen(true)
    },
    {
      id: "emergency-override",
      title: "Emergency Override",
      description: "Forward calls to staff now",
      icon: AlertTriangle,
      priority: "high",
      category: "emergency",
      action: () => console.log("Activating emergency override...")
    },
    {
      id: "run-simulation",
      title: "Run Simulation",
      description: "Test booking scenario",
      icon: PlayCircle,
      priority: "medium",
      category: "daily",
      action: () => console.log("Running simulation...")
    },
    {
      id: "view-analytics",
      title: "Performance Report",
      description: "Today's summary report",
      icon: BarChart3,
      priority: "medium",
      category: "daily",
      action: () => console.log("Generating report...")
    },
    {
      id: "schedule-maintenance",
      title: "Schedule Maintenance",
      description: "Plan system maintenance window",
      icon: Settings,
      priority: "low",
      category: "admin",
      action: () => console.log("Scheduling maintenance...")
    },
    {
      id: "invite-staff",
      title: "Invite Team Member",
      description: "Add new staff member to system",
      icon: Users,
      priority: "medium",
      category: "admin",
      action: () => console.log("Inviting team member...")
    },
    {
      id: "backup-data",
      title: "Download Backup",
      description: "Export all clinic data",
      icon: Download,
      priority: "low",
      category: "admin",
      action: () => console.log("Creating backup...")
    },
    {
      id: "optimize-ai",
      title: "AI Optimization",
      description: "Auto-tune AI based on recent calls",
      icon: Zap,
      priority: "medium",
      category: "daily",
      action: () => console.log("Optimizing AI...")
    },
    {
      id: "business-hours",
      title: "Update Hours",
      description: "Modify clinic operating hours",
      icon: Clock,
      priority: "low",
      category: "admin",
      action: () => console.log("Updating hours...")
    },
    {
      id: "security-check",
      title: "Security Scan",
      description: "Run comprehensive security check",
      icon: Shield,
      priority: "low",
      category: "admin",
      action: () => console.log("Running security scan...")
    }
  ];

  const emergencyActions = quickActions.filter(action => action.category === 'emergency');
  const dailyActions = quickActions.filter(action => action.category === 'daily');
  const adminActions = quickActions.filter(action => action.category === 'admin');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const ActionButton = ({ action }: { action: QuickAction }) => {
    const Icon = action.icon;
    const loading = isLoading === action.id;
    
    return (
      <Button
        variant="outline"
        className="h-auto p-4 flex flex-col items-center space-y-2 relative"
        onClick={() => handleAction(action.id, action.action)}
        disabled={loading}
        data-testid={`quick-action-${action.id}`}
      >
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(action.priority)}`}></div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium truncate">{action.title}</p>
          <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
        </div>
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Actions
            <Badge variant="destructive" className="ml-2">High Priority</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyActions.map((action) => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Daily Actions
            <Badge variant="secondary" className="ml-2">Frequent Use</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dailyActions.map((action) => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Administration
            <Badge variant="outline" className="ml-2">Setup & Config</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {adminActions.map((action) => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">98%</p>
              <p className="text-sm text-gray-600">System Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">2.3s</p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">£1,250</p>
              <p className="text-sm text-gray-600">Monthly Savings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4.8/5</p>
              <p className="text-sm text-gray-600">Patient Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Placement Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Test Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+441234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
                className={phoneNumber && !validatePhoneNumber(phoneNumber) ? "border-red-500" : ""}
              />
              <p className={`text-sm mt-1 ${
                phoneNumber && !validatePhoneNumber(phoneNumber) 
                  ? "text-red-500" 
                  : "text-gray-500"
              }`}>
                {phoneNumber && !validatePhoneNumber(phoneNumber) 
                  ? "Invalid format - must start with + and country code" 
                  : "Enter phone number in E.164 format (e.g., +441234567890)"
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleMakeCall}
                disabled={makeCallMutation.isPending || !phoneNumber.trim()}
                className="flex-1"
                data-testid="button-make-call"
              >
                {makeCallMutation.isPending ? "Calling..." : "Place Call"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCallDialogOpen(false);
                  setPhoneNumber("");
                }}
                data-testid="button-cancel-call"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}