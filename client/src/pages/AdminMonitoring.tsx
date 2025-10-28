import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle, Clock, DollarSign, Users, Building, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminMonitoring() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['/health'],
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000
  });

  if (metricsLoading || healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-500';
      case 'warning': case 'slow': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'warning': case 'slow': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-monitoring-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Platform Monitoring</h1>
        <Badge 
          variant={(health as any)?.status === 'ok' ? 'default' : (health as any)?.status === 'warning' ? 'secondary' : 'destructive'}
          className="flex items-center gap-2"
          data-testid={`badge-system-status-${(health as any)?.status}`}
        >
          {getStatusIcon((health as any)?.status || 'unknown')}
          System {(health as any)?.status || 'Unknown'}
        </Badge>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-database-health">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <div className={`flex items-center gap-1 ${getStatusColor((health as any)?.checks?.database?.status || 'unknown')}`}>
              {getStatusIcon((health as any)?.checks?.database?.status || 'unknown')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-db-latency">
              {(health as any)?.checks?.database?.latency || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-memory-usage">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <div className={`flex items-center gap-1 ${getStatusColor((health as any)?.checks?.memory?.status || 'unknown')}`}>
              {getStatusIcon((health as any)?.checks?.memory?.status || 'unknown')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-memory-usage">
              {(health as any)?.checks?.memory?.usage || 0}MB
            </div>
            <p className="text-xs text-muted-foreground">
              {(health as any)?.checks?.memory?.percentage || 0}% used
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-uptime">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-uptime">
              {Math.floor(((health as any)?.uptime || 0) / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((((health as any)?.uptime || 0) % 3600) / 60)}m uptime
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-external-services">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Twilio</span>
                <Badge 
                  variant={(health as any)?.checks?.twilio?.status === 'configured' ? 'default' : 'secondary'}
                  className="h-5 text-xs"
                  data-testid="badge-twilio-status"
                >
                  {(health as any)?.checks?.twilio?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>ElevenLabs</span>
                <Badge 
                  variant={(health as any)?.checks?.elevenlabs?.status === 'configured' ? 'default' : 'secondary'}
                  className="h-5 text-xs"
                  data-testid="badge-elevenlabs-status"
                >
                  {(health as any)?.checks?.elevenlabs?.status || 'unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-clinics">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-clinics">
              {(metrics as any)?.platform?.clinics?.totalClinics || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {(metrics as any)?.platform?.clinics?.activeClinics || 0} active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {(metrics as any)?.platform?.users?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {(metrics as any)?.platform?.users?.adminUsers || 0} admins
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-calls">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-calls">
              {(metrics as any)?.platform?.clinics?.totalCalls || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {(metrics as any)?.platform?.clinics?.monthlyCallsUsed || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-monthly-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
              £{(metrics as any)?.platform?.revenue?.monthlyRecurring || 0}
            </div>
            <p className="text-xs text-muted-foreground">Recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card data-testid="card-subscription-distribution">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Subscription Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(metrics as any)?.platform?.subscriptions?.map((sub: any) => (
              <div key={sub.tier} className="text-center p-4 border rounded-lg" data-testid={`subscription-tier-${sub.tier}`}>
                <div className="text-2xl font-bold text-blue-600" data-testid={`text-${sub.tier}-count`}>
                  {sub.count}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {sub.tier} Plan
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card data-testid="card-system-info">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Version</div>
              <div data-testid="text-system-version">{(health as any)?.version || '1.0.0'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Environment</div>
              <div data-testid="text-system-environment">{(health as any)?.environment || 'unknown'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Last Health Check</div>
              <div data-testid="text-last-health-check">
                {(health as any)?.timestamp ? new Date((health as any).timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Metrics Updated</div>
              <div data-testid="text-metrics-updated">
                {(metrics as any)?.timestamp ? new Date((metrics as any).timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}