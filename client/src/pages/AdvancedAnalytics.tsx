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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Phone,
  Calendar,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Send,
  Play,
  Clock,
  Award,
  Activity,
  Zap,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

// Chart colors
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdvancedAnalytics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportName: '',
    reportType: 'comprehensive',
    frequency: 'monthly',
    recipients: '',
  });

  // Date range calculations
  const getDateRange = (days: string) => {
    const now = new Date();
    const startDate = subDays(now, parseInt(days));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange(selectedDateRange);

  // Data queries
  const { data: cohortsData, isLoading: cohortsLoading } = useQuery({
    queryKey: [`/api/analytics/cohorts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: callOutcomesData, isLoading: callOutcomesLoading } = useQuery({
    queryKey: [`/api/analytics/call-outcomes?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&metric=${selectedMetric}`],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: benchmarksData, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['/api/analytics/benchmarks'],
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/analytics/reports'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Mutations
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/analytics/reports', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/reports'] });
      toast({
        title: 'Report Created',
        description: 'Your analytics report has been created successfully.',
      });
      setShowReportDialog(false);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('POST', `/api/analytics/reports/${reportId}/generate`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report Generation Started',
        description: 'Your report is being generated. You will be notified when it is ready.',
      });
    },
  });

  // Chart data processing
  const processCallOutcomeChart = () => {
    const data = callOutcomesData as any;
    if (!data?.metrics) return [];
    
    const outcomeGroups = data.metrics.reduce((acc: any, metric: any) => {
      const date = format(new Date(metric.createdAt), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, completed: 0, abandoned: 0, transferred: 0, appointments: 0 };
      }
      acc[date][metric.callOutcome] = (acc[date][metric.callOutcome] || 0) + 1;
      if (metric.appointmentBooked) {
        acc[date].appointments += 1;
      }
      return acc;
    }, {});

    return Object.values(outcomeGroups).slice(-14); // Last 2 weeks
  };

  const processPerformanceComparison = () => {
    const data = benchmarksData as any;
    if (!data?.benchmarks) return [];
    
    return data.benchmarks.map((benchmark: any) => ({
      metric: benchmark.metricName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      yourValue: parseFloat(benchmark.clinicValue) || 0,
      benchmark: parseFloat(benchmark.benchmarkValue) || 0,
      percentile: benchmark.percentileRank,
    }));
  };

  const getCohortRetentionData = () => {
    const data = cohortsData as any;
    if (!data?.cohorts) return [];
    
    return data.cohorts.slice(0, 6).map((cohort: any, index: number) => ({
      period: cohort.cohortPeriod,
      week1: cohort.retentionData.week1 || 0,
      month1: cohort.retentionData.month1 || 0,
      month3: cohort.retentionData.month3 || 0,
      month6: cohort.retentionData.month6 || 0,
    }));
  };

  const handleCreateReport = () => {
    const recipients = reportForm.recipients.split(',').map(email => email.trim()).filter(Boolean);
    
    createReportMutation.mutate({
      reportName: reportForm.reportName,
      reportType: reportForm.reportType,
      frequency: reportForm.frequency,
      recipients,
      reportConfig: {
        dateRange: dateRange,
        includeCharts: true,
        includeBenchmarks: true,
      }
    });
  };

  const getTrendIcon = (value: number, benchmark: number) => {
    if (value > benchmark) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < benchmark) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-blue-600" />;
  };

  const getTrendColor = (value: number, benchmark: number) => {
    if (value > benchmark) return 'text-green-600';
    if (value < benchmark) return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="advanced-analytics">
      {/* Header with Back Button */}
      <PageHeader 
        title="Advanced Analytics" 
        description="Deep insights, cohort analysis, and performance benchmarking"
        backTo="/business-analytics"
      >
        <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <SelectTrigger className="w-32" data-testid="select-date-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-report">
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Analytics Report</DialogTitle>
              <DialogDescription>
                Set up automated or on-demand analytics reports.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  data-testid="input-report-name"
                  placeholder="Monthly Performance Report"
                  value={reportForm.reportName}
                  onChange={(e) => setReportForm({ ...reportForm, reportName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">Type</Label>
                  <Select
                    value={reportForm.reportType}
                    onValueChange={(value) => setReportForm({ ...reportForm, reportType: value })}
                  >
                    <SelectTrigger data-testid="select-report-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="cohort">Cohort Analysis</SelectItem>
                      <SelectItem value="call_metrics">Call Metrics</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="report-frequency">Frequency</Label>
                  <Select
                    value={reportForm.frequency}
                    onValueChange={(value) => setReportForm({ ...reportForm, frequency: value })}
                  >
                    <SelectTrigger data-testid="select-report-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_demand">On Demand</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="report-recipients">Email Recipients</Label>
                <Input
                  id="report-recipients"
                  data-testid="input-report-recipients"
                  placeholder="admin@clinic.com, manager@clinic.com"
                  value={reportForm.recipients}
                  onChange={(e) => setReportForm({ ...reportForm, recipients: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateReport} 
                  disabled={createReportMutation.isPending}
                  data-testid="button-save-report"
                >
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Key Performance Indicators */}
      {(callOutcomesData as any)?.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-total-calls">
                {(callOutcomesData as any).summary.totalCalls || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointment Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="metric-appointment-rate">
                {(((callOutcomesData as any).summary.appointmentRate || 0) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="metric-satisfaction">
                {((callOutcomesData as any).summary.avgSatisfaction || 0).toFixed(1)}/5
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Performance</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="metric-ai-performance">
                {((callOutcomesData as any).summary.avgAiScore || 0).toFixed(1)}/5
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="cohorts" data-testid="tab-cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="call-analysis" data-testid="tab-call-analysis">Call Analysis</TabsTrigger>
          <TabsTrigger value="benchmarks" data-testid="tab-benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Call Outcomes Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="w-5 h-5 mr-2" />
                  Call Outcomes Trend
                </CardTitle>
                <CardDescription>Daily call outcome patterns over the last 2 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                {callOutcomesLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={processCallOutcomeChart()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="appointments" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="abandoned" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Impact
                </CardTitle>
                <CardDescription>Cost vs revenue attribution from calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600" data-testid="total-costs">
                      £{(callOutcomesData?.summary?.totalCost || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Costs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="total-revenue">
                      £{(callOutcomesData?.summary?.totalRevenue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Revenue Generated</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {callOutcomesData?.summary?.totalRevenue && callOutcomesData?.summary?.totalCost ? 
                        `${(callOutcomesData.summary.totalRevenue / callOutcomesData.summary.totalCost).toFixed(1)}x` : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">ROI Multiplier</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Cohort Retention Analysis
              </CardTitle>
              <CardDescription>Track user retention over time periods</CardDescription>
            </CardHeader>
            <CardContent>
              {cohortsLoading ? (
                <div className="h-64 flex items-center justify-center">Loading cohort data...</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getCohortRetentionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="week1" stroke="#3B82F6" strokeWidth={2} name="Week 1" />
                    <Line type="monotone" dataKey="month1" stroke="#10B981" strokeWidth={2} name="Month 1" />
                    <Line type="monotone" dataKey="month3" stroke="#F59E0B" strokeWidth={2} name="Month 3" />
                    <Line type="monotone" dataKey="month6" stroke="#EF4444" strokeWidth={2} name="Month 6" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {cohortsData?.summary && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {(cohortsData.summary.averageRetention || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(cohortsData.summary.averageConversion || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    £{(cohortsData.summary.totalRevenue || 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Call Analysis Tab */}
        <TabsContent value="call-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Detailed Call Metrics
              </CardTitle>
              <CardDescription>In-depth analysis of call performance and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {callOutcomesData?.metrics?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No call metrics data available for the selected period.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Transfer Rate</h4>
                      <div className="flex items-center space-x-2">
                        <Progress value={(callOutcomesData?.summary?.transferRate || 0) * 100} className="flex-1" />
                        <span className="text-sm font-medium">
                          {((callOutcomesData?.summary?.transferRate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Average Call Duration</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(callOutcomesData?.summary?.avgDuration || 0)}s
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>Compare your performance against industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              {benchmarksLoading ? (
                <div className="h-64 flex items-center justify-center">Loading benchmark data...</div>
              ) : benchmarksData?.benchmarks?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No benchmark data available. Data will populate as your clinic usage grows.
                </div>
              ) : (
                <div className="space-y-4">
                  {processPerformanceComparison().map((benchmark, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(benchmark.yourValue, benchmark.benchmark)}
                        <div>
                          <h4 className="font-semibold">{benchmark.metric}</h4>
                          <p className="text-sm text-muted-foreground">
                            {benchmark.percentile}th percentile
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getTrendColor(benchmark.yourValue, benchmark.benchmark)}`}>
                          {benchmark.yourValue.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Industry: {benchmark.benchmark.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics Reports
              </CardTitle>
              <CardDescription>Manage scheduled reports and generate on-demand analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : reportsData?.reports?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reports created yet. Click "Create Report" to set up your first analytics report.
                </div>
              ) : (
                <div className="space-y-3">
                  {reportsData.reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{report.reportName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="capitalize">{report.reportType}</span>
                          <span className="capitalize">{report.frequency}</span>
                          {report.lastGenerated && (
                            <span>
                              Last: {format(new Date(report.lastGenerated), 'MMM d, yyyy')}
                            </span>
                          )}
                          <Badge variant={report.isActive ? 'default' : 'secondary'}>
                            {report.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReportMutation.mutate(report.id)}
                          disabled={generateReportMutation.isPending}
                          data-testid={`button-generate-${report.id}`}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}