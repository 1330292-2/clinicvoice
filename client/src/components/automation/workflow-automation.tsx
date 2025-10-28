import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Clock, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings,
  Plus
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'missed_call' | 'appointment_booked' | 'time_based' | 'patient_action';
    conditions: string[];
  };
  actions: {
    type: 'send_sms' | 'send_email' | 'create_task' | 'update_record' | 'notify_staff';
    parameters: Record<string, any>;
  }[];
  isActive: boolean;
  category: 'communication' | 'scheduling' | 'follow_up' | 'emergency';
  lastTriggered?: Date;
  timesTriggered: number;
}

export default function WorkflowAutomation() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Missed Call Follow-up',
      trigger: {
        type: 'missed_call',
        conditions: ['during business hours', 'not emergency']
      },
      actions: [
        {
          type: 'send_sms',
          parameters: {
            message: 'We missed your call. Please call back or book online.',
            delay: '5 minutes'
          }
        },
        {
          type: 'create_task',
          parameters: {
            assignee: 'reception',
            priority: 'medium',
            description: 'Follow up on missed call'
          }
        }
      ],
      isActive: true,
      category: 'communication',
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
      timesTriggered: 23
    },
    {
      id: '2',
      name: 'Appointment Reminders',
      trigger: {
        type: 'time_based',
        conditions: ['24 hours before appointment', 'patient opted in']
      },
      actions: [
        {
          type: 'send_sms',
          parameters: {
            message: 'Reminder: You have an appointment tomorrow at {time}. Reply CANCEL to cancel.',
            template: 'appointment_reminder'
          }
        },
        {
          type: 'send_email',
          parameters: {
            subject: 'Appointment Reminder',
            template: 'appointment_reminder_email'
          }
        }
      ],
      isActive: true,
      category: 'scheduling',
      lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
      timesTriggered: 156
    },
    {
      id: '3',
      name: 'Emergency Escalation',
      trigger: {
        type: 'patient_action',
        conditions: ['emergency keywords detected', 'high urgency score']
      },
      actions: [
        {
          type: 'notify_staff',
          parameters: {
            urgency: 'immediate',
            channels: ['phone', 'sms', 'email'],
            message: 'URGENT: Emergency call detected'
          }
        },
        {
          type: 'create_task',
          parameters: {
            assignee: 'on_call_doctor',
            priority: 'urgent',
            description: 'Emergency patient call requires immediate attention'
          }
        }
      ],
      isActive: true,
      category: 'emergency',
      lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
      timesTriggered: 3
    },
    {
      id: '4',
      name: 'Post-Appointment Follow-up',
      trigger: {
        type: 'appointment_booked',
        conditions: ['appointment completed', 'first-time patient']
      },
      actions: [
        {
          type: 'send_email',
          parameters: {
            subject: 'Thank you for your visit',
            template: 'post_appointment_survey',
            delay: '2 hours'
          }
        },
        {
          type: 'create_task',
          parameters: {
            assignee: 'patient_care',
            priority: 'low',
            description: 'Follow up on patient experience'
          }
        }
      ],
      isActive: false,
      category: 'follow_up',
      timesTriggered: 0
    }
  ]);

  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: '',
    actionType: '',
    isActive: true
  });

  const triggerTypes = [
    { value: 'missed_call', label: 'Missed Call', icon: Phone },
    { value: 'appointment_booked', label: 'Appointment Booked', icon: Calendar },
    { value: 'time_based', label: 'Time-based', icon: Clock },
    { value: 'patient_action', label: 'Patient Action', icon: Users }
  ];

  const actionTypes = [
    { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'create_task', label: 'Create Task', icon: FileText },
    { value: 'notify_staff', label: 'Notify Staff', icon: AlertTriangle },
    { value: 'update_record', label: 'Update Record', icon: FileText }
  ];

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'communication': return 'bg-blue-100 text-blue-800';
      case 'scheduling': return 'bg-green-100 text-green-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (actionType: string) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action ? action.icon : FileText;
  };

  const formatLastTriggered = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
            <p className="text-sm text-gray-600">Active Rules</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {automationRules.reduce((sum, rule) => sum + rule.timesTriggered, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Triggers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">87%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">2.3h</p>
            <p className="text-sm text-gray-600">Time Saved Daily</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Automation Rules
            </div>
            <Button onClick={() => setShowCreateRule(true)} data-testid="create-automation-rule">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${rule.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                      data-testid={`toggle-rule-${rule.id}`}
                    />
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Triggered {rule.timesTriggered} times
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Last: {formatLastTriggered(rule.lastTriggered)}
                    </span>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Trigger</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700 capitalize">
                        {rule.trigger.type.replace('_', ' ')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rule.trigger.conditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Actions</h4>
                    <div className="space-y-2">
                      {rule.actions.map((action, index) => {
                        const ActionIcon = getActionIcon(action.type);
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <ActionIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 capitalize">
                              {action.type.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Rule Modal */}
      {showCreateRule && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Create Automation Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Send follow-up after appointment"
              />
            </div>

            <div>
              <Label>Trigger Type</Label>
              <Select 
                value={newRule.triggerType} 
                onValueChange={(value) => setNewRule(prev => ({ ...prev, triggerType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select what triggers this rule" />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {trigger.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action Type</Label>
              <Select 
                value={newRule.actionType} 
                onValueChange={(value) => setNewRule(prev => ({ ...prev, actionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select what action to take" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => {
                    const Icon = action.icon;
                    return (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Activate Rule</Label>
              <Switch
                checked={newRule.isActive}
                onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => {
                  console.log('Creating rule:', newRule);
                  setShowCreateRule(false);
                  setNewRule({ name: '', triggerType: '', actionType: '', isActive: true });
                }}
                data-testid="save-automation-rule"
              >
                Create Rule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateRule(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Automation Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Patient No-Show Follow-up</h4>
              <p className="text-sm text-gray-600 mb-3">
                Automatically send reminders and rebook appointments for no-shows
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">SMS</Badge>
                <Badge variant="outline">Email</Badge>
                <Badge variant="outline">Task Creation</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Use Template
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Emergency Alert System</h4>
              <p className="text-sm text-gray-600 mb-3">
                Instant notifications to staff when emergency keywords are detected
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Staff Alert</Badge>
                <Badge variant="outline">Priority Escalation</Badge>
                <Badge variant="outline">Call Routing</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Use Template
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Prescription Reminder</h4>
              <p className="text-sm text-gray-600 mb-3">
                Send medication reminders and refill notifications to patients
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">SMS</Badge>
                <Badge variant="outline">Schedule</Badge>
                <Badge variant="outline">Integration</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Use Template
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Appointment Confirmation</h4>
              <p className="text-sm text-gray-600 mb-3">
                Automatic confirmation messages with appointment details
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">WhatsApp</Badge>
                <Badge variant="outline">Email</Badge>
                <Badge variant="outline">Calendar</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Use Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}