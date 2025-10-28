import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Database, 
  Calendar, 
  Users, 
  CreditCard, 
  Mail, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Settings,
  Link,
  RefreshCw
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  category: 'emr' | 'calendar' | 'billing' | 'communication';
  icon: any;
  status: 'connected' | 'disconnected' | 'pending';
  description: string;
  features: string[];
  popular: boolean;
}

interface ConnectionConfig {
  apiKey: string;
  serverUrl: string;
  username: string;
  syncEnabled: boolean;
  autoBackup: boolean;
}

export default function PracticeManagementIntegrations() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [config, setConfig] = useState<ConnectionConfig>({
    apiKey: "",
    serverUrl: "",
    username: "",
    syncEnabled: true,
    autoBackup: true
  });

  const integrations: Integration[] = [
    {
      id: "emis-web",
      name: "EMIS Web",
      category: "emr",
      icon: Database,
      status: "disconnected",
      description: "Leading UK primary care clinical system",
      features: ["Patient records sync", "Appointment integration", "Clinical notes", "Prescriptions"],
      popular: true
    },
    {
      id: "systemone",
      name: "SystmOne",
      category: "emr",
      icon: Database,
      status: "connected",
      description: "Comprehensive healthcare record system",
      features: ["Full patient history", "Care planning", "Clinical workflow", "Reporting"],
      popular: true
    },
    {
      id: "vision",
      name: "Vision",
      category: "emr",
      icon: Database,
      status: "disconnected",
      description: "Practice management and clinical system",
      features: ["Patient management", "Clinical records", "Prescribing", "Recall system"],
      popular: false
    },
    {
      id: "accubook",
      name: "AccuBook",
      category: "calendar",
      icon: Calendar,
      status: "connected",
      description: "Online appointment booking system",
      features: ["Online booking", "SMS reminders", "Waitlist management", "Calendar sync"],
      popular: true
    },
    {
      id: "docman",
      name: "Docman",
      category: "communication",
      icon: Mail,
      status: "pending",
      description: "Document and workflow management",
      features: ["Document scanning", "Workflow automation", "Task management", "Compliance"],
      popular: false
    },
    {
      id: "patient-access",
      name: "Patient Access",
      category: "communication",
      icon: Users,
      status: "disconnected",
      description: "Patient portal and mobile app",
      features: ["Online consultations", "Prescription requests", "Test results", "Messaging"],
      popular: true
    },
    {
      id: "stripe",
      name: "Stripe Payments",
      category: "billing",
      icon: CreditCard,
      status: "connected",
      description: "Payment processing and billing",
      features: ["Online payments", "Subscription billing", "Invoice generation", "Analytics"],
      popular: true
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      category: "communication",
      icon: MessageSquare,
      status: "disconnected",
      description: "WhatsApp messaging for patient communication",
      features: ["Appointment reminders", "Health tips", "Prescription updates", "Two-way messaging"],
      popular: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'pending': return 'Pending';
      case 'disconnected': return 'Not Connected';
      default: return 'Unknown';
    }
  };

  const handleConnect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
  };

  const handleSaveConfig = () => {
    console.log('Saving configuration:', config);
    setSelectedIntegration(null);
  };

  const categorizedIntegrations = {
    emr: integrations.filter(i => i.category === 'emr'),
    calendar: integrations.filter(i => i.category === 'calendar'),
    billing: integrations.filter(i => i.category === 'billing'),
    communication: integrations.filter(i => i.category === 'communication')
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-gray-600">Connected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">1</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">156</p>
            <p className="text-sm text-gray-600">Records Synced</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">99.8%</p>
            <p className="text-sm text-gray-600">Sync Success</p>
          </CardContent>
        </Card>
      </div>

      {/* EMR/EHR Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Electronic Medical Records (EMR/EHR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedIntegrations.emr.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium flex items-center">
                          {integration.name}
                          {integration.popular && (
                            <Badge variant="secondary" className="ml-2 text-xs">Popular</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                      <Badge variant="outline">{getStatusText(integration.status)}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleConnect(integration.id)}
                        data-testid={`connect-${integration.id}`}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendar & Scheduling Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedIntegrations.calendar.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Communication Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Communication & Patient Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedIntegrations.communication.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium flex items-center">
                          {integration.name}
                          {integration.popular && (
                            <Badge variant="secondary" className="ml-2 text-xs">Popular</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                      <Badge variant="outline">{getStatusText(integration.status)}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {integration.status === 'connected' ? (
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    ) : integration.status === 'pending' ? (
                      <Button size="sm" variant="outline" disabled>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Pending Approval
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(integration.id)}>
                        <Link className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Configuration Modal */}
      {selectedIntegration && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Configure Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
                type="password"
              />
            </div>
            
            <div>
              <Label htmlFor="server-url">Server URL</Label>
              <Input
                id="server-url"
                value={config.serverUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                placeholder="https://your-server.com/api"
              />
            </div>
            
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Your username"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Automatic Sync</Label>
                <Switch
                  checked={config.syncEnabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncEnabled: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Enable Auto Backup</Label>
                <Switch
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoBackup: checked }))}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button onClick={handleSaveConfig} data-testid="save-integration-config">
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}