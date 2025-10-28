import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Webhook, 
  Plus, 
  Copy, 
  Trash2, 
  Activity, 
  BarChart3, 
  Code, 
  ExternalLink,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function DeveloperPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API Keys Management
  const { data: apiKeysData, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/clinic/api-keys'],
    staleTime: 5 * 60 * 1000,
  });

  // Webhooks Management
  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['/api/clinic/webhooks'],
    staleTime: 5 * 60 * 1000,
  });

  // API Usage Analytics
  const { data: usageData } = useQuery({
    queryKey: ['/api/clinic/api-usage'],
    staleTime: 10 * 60 * 1000,
  });

  // Create API Key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { keyName: string; permissions: string[]; environment: string; expiresAt?: string }) => {
      const response = await apiRequest('POST', '/api/clinic/api-keys', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic/api-keys'] });
      toast({
        title: 'API Key Created',
        description: 'Your new API key has been created successfully.',
      });
      setNewApiKey(data.apiKey.plainKey);
      setShowApiKeyDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create API key. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create Webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (data: { url: string; description: string; events: string[] }) => {
      const response = await apiRequest('POST', '/api/clinic/webhooks', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic/webhooks'] });
      toast({
        title: 'Webhook Created',
        description: 'Your webhook has been configured successfully.',
      });
      setShowWebhookDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create webhook. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Revoke API Key mutation
  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiRequest('DELETE', `/api/clinic/api-keys/${keyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic/api-keys'] });
      toast({
        title: 'API Key Revoked',
        description: 'The API key has been permanently revoked.',
      });
    },
  });

  // State management
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [apiKeyForm, setApiKeyForm] = useState({
    keyName: '',
    permissions: [] as string[],
    environment: 'live',
    expiresAt: '',
  });
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    description: '',
    events: [] as string[],
  });

  const availablePermissions = [
    'read:clinic',
    'read:calls',
    'read:appointments',
    'write:appointments',
    'read:analytics',
  ];

  const availableEvents = [
    'call.completed',
    'call.recording.ready',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard.',
    });
  };

  const handleCreateApiKey = () => {
    if (!apiKeyForm.keyName || apiKeyForm.permissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a key name and select at least one permission.',
        variant: 'destructive',
      });
      return;
    }

    createApiKeyMutation.mutate({
      ...apiKeyForm,
      expiresAt: apiKeyForm.expiresAt || undefined,
    });
  };

  const handleCreateWebhook = () => {
    if (!webhookForm.url || webhookForm.events.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a webhook URL and select at least one event.',
        variant: 'destructive',
      });
      return;
    }

    createWebhookMutation.mutate(webhookForm);
  };

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="developer-portal">
      {/* Header with Back Button */}
      <PageHeader 
        title="Developer Portal" 
        description="Manage API keys, webhooks, and integrations for your clinic"
        backTo="/"
      >
        <Button variant="outline" asChild>
          <a href="https://docs.clinicvoice.co.uk/api" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            API Docs
          </a>
        </Button>
      </PageHeader>

      {/* Usage Overview */}
      {(usageData as any)?.usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              API Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="metric-total-requests">
                  {(usageData as any).usage.totalRequests || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="metric-successful-requests">
                  {(usageData as any).usage.successfulRequests || 0}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="metric-error-requests">
                  {(usageData as any).usage.errorRequests || 0}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="metric-avg-response-time">
                  {Math.round((usageData as any).usage.avgResponseTime || 0)}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation" data-testid="tab-documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage API keys for accessing the ClinicVoice API
              </p>
            </div>
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-api-key">
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key with specific permissions for your application.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      data-testid="input-key-name"
                      placeholder="e.g., Production API Key"
                      value={apiKeyForm.keyName}
                      onChange={(e) => setApiKeyForm({ ...apiKeyForm, keyName: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availablePermissions.map((permission) => (
                        <Label key={permission} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            data-testid={`checkbox-permission-${permission}`}
                            checked={apiKeyForm.permissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setApiKeyForm({ 
                                  ...apiKeyForm, 
                                  permissions: [...apiKeyForm.permissions, permission] 
                                });
                              } else {
                                setApiKeyForm({ 
                                  ...apiKeyForm, 
                                  permissions: apiKeyForm.permissions.filter(p => p !== permission) 
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{permission}</span>
                        </Label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={apiKeyForm.environment}
                      onValueChange={(value) => setApiKeyForm({ ...apiKeyForm, environment: value })}
                    >
                      <SelectTrigger data-testid="select-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expires-at">Expiration (Optional)</Label>
                    <Input
                      id="expires-at"
                      data-testid="input-expires-at"
                      type="datetime-local"
                      value={apiKeyForm.expiresAt}
                      onChange={(e) => setApiKeyForm({ ...apiKeyForm, expiresAt: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKeyDialog(false)}
                      data-testid="button-cancel-api-key"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateApiKey} 
                      disabled={createApiKeyMutation.isPending}
                      data-testid="button-submit-api-key"
                    >
                      Create Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* New API Key Display */}
          {newApiKey && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Your new API key has been created!</p>
                  <p className="text-sm">Copy this key now - you won't be able to see it again.</p>
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <code className="flex-1 text-sm" data-testid="text-new-api-key">{newApiKey}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey)}
                      data-testid="button-copy-new-key"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewApiKey('')}
                    data-testid="button-dismiss-new-key"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* API Keys List */}
          <div className="space-y-3">
            {apiKeysLoading ? (
              <div className="text-center py-8" data-testid="loading-api-keys">Loading API keys...</div>
            ) : apiKeysData?.apiKeys?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-api-keys">
                No API keys created yet. Create your first API key to get started.
              </div>
            ) : (
              apiKeysData?.apiKeys?.map((key: any) => (
                <Card key={key.id} data-testid={`api-key-${key.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4" />
                          <h4 className="font-semibold" data-testid={`key-name-${key.id}`}>
                            {key.keyName}
                          </h4>
                          <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                            {key.environment}
                          </Badge>
                          <Badge variant={key.status === 'active' ? 'default' : 'destructive'}>
                            {key.status}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Key: <code data-testid={`key-prefix-${key.id}`}>{key.keyPrefix}••••••••••••</code>
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-4">
                            <span>
                              Permissions: {key.permissions?.join(', ') || 'None'}
                            </span>
                            {key.lastUsedAt && (
                              <span data-testid={`last-used-${key.id}`}>
                                Last used: {format(new Date(key.lastUsedAt), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {key.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeApiKeyMutation.mutate(key.id)}
                            disabled={revokeApiKeyMutation.isPending}
                            data-testid={`button-revoke-${key.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Configure webhook endpoints to receive real-time event notifications
              </p>
            </div>
            <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-webhook">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook to receive event notifications from ClinicVoice.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      data-testid="input-webhook-url"
                      placeholder="https://your-app.com/webhooks/clinicvoice"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="webhook-description">Description (Optional)</Label>
                    <Textarea
                      id="webhook-description"
                      data-testid="input-webhook-description"
                      placeholder="Description of what this webhook is used for"
                      value={webhookForm.description}
                      onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Events to Subscribe</Label>
                    <div className="grid gap-2 mt-2">
                      {availableEvents.map((event) => (
                        <Label key={event} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            data-testid={`checkbox-event-${event}`}
                            checked={webhookForm.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookForm({ 
                                  ...webhookForm, 
                                  events: [...webhookForm.events, event] 
                                });
                              } else {
                                setWebhookForm({ 
                                  ...webhookForm, 
                                  events: webhookForm.events.filter(e => e !== event) 
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{event}</span>
                        </Label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowWebhookDialog(false)}
                      data-testid="button-cancel-webhook"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateWebhook} 
                      disabled={createWebhookMutation.isPending}
                      data-testid="button-submit-webhook"
                    >
                      Create Webhook
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Webhooks List */}
          <div className="space-y-3">
            {webhooksLoading ? (
              <div className="text-center py-8" data-testid="loading-webhooks">Loading webhooks...</div>
            ) : webhooksData?.webhooks?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-webhooks">
                No webhooks configured yet. Create your first webhook to receive event notifications.
              </div>
            ) : (
              webhooksData?.webhooks?.map((webhook: any) => (
                <Card key={webhook.id} data-testid={`webhook-${webhook.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Webhook className="w-4 h-4" />
                          <h4 className="font-semibold" data-testid={`webhook-url-${webhook.id}`}>
                            {webhook.url}
                          </h4>
                          <Badge variant={webhook.status === 'active' ? 'default' : 'destructive'}>
                            {webhook.status}
                          </Badge>
                        </div>
                        {webhook.description && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`webhook-description-${webhook.id}`}>
                            {webhook.description}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Events: {webhook.events?.join(', ') || 'None'}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {webhook.lastSuccessAt && (
                              <span className="flex items-center" data-testid={`webhook-last-success-${webhook.id}`}>
                                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                Last success: {format(new Date(webhook.lastSuccessAt), 'MMM d, yyyy')}
                              </span>
                            )}
                            {webhook.consecutiveFailures > 0 && (
                              <span className="flex items-center text-red-600" data-testid={`webhook-failures-${webhook.id}`}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {webhook.consecutiveFailures} consecutive failures
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Complete guide to integrating with the ClinicVoice API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Getting Started</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn the basics of authentication and making your first API call.
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="link-getting-started">
                      <a href="https://docs.clinicvoice.co.uk/api/getting-started" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Guide
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">API Reference</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete reference for all API endpoints and parameters.
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="link-api-reference">
                      <a href="https://docs.clinicvoice.co.uk/api/reference" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Reference
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Webhooks Guide</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn how to receive and handle webhook events securely.
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="link-webhooks-guide">
                      <a href="https://docs.clinicvoice.co.uk/api/webhooks" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Guide
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">SDKs & Libraries</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Official libraries and SDKs for popular programming languages.
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="link-sdks">
                      <a href="https://docs.clinicvoice.co.uk/api/sdks" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View SDKs
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Start Example */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold mb-2">Authentication</h5>
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto" data-testid="code-auth-example">
{`curl -H "Authorization: Bearer pk_live_your_api_key_here" \\
  https://api.clinicvoice.co.uk/api/v1/clinic`}
                      </pre>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2">Create Appointment</h5>
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto" data-testid="code-create-appointment">
{`curl -X POST https://api.clinicvoice.co.uk/api/v1/appointments \\
  -H "Authorization: Bearer pk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patientName": "John Smith",
    "patientPhone": "+44 20 7946 0958",
    "appointmentDate": "2024-02-15T14:30:00Z",
    "appointmentType": "Consultation",
    "duration": 30
  }'`}
                      </pre>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Webhook Event</h5>
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto" data-testid="code-webhook-example">
{`{
  "event": "appointment.created",
  "timestamp": "2024-02-15T10:30:00Z",
  "data": {
    "id": "apt_1234567890",
    "patientName": "John Smith",
    "appointmentDate": "2024-02-15T14:30:00Z",
    "status": "confirmed"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}