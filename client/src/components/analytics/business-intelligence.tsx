import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Phone, 
  Calendar,
  Target,
  Brain,
  Lightbulb,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
    growth: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    retention: number;
    satisfaction: number;
  };
  efficiency: {
    callResolution: number;
    avgCallDuration: number;
    noShowRate: number;
    costPerCall: number;
  };
  predictions: {
    nextMonthRevenue: number;
    peakHours: string[];
    staffingNeeds: number;
    growthOpportunity: number;
  };
}

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  potentialValue: string;
}

export default function BusinessIntelligence() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: {
      current: 45600,
      previous: 42300,
      trend: 'up',
      growth: 7.8
    },
    patients: {
      total: 2847,
      newThisMonth: 89,
      retention: 94.2,
      satisfaction: 4.7
    },
    efficiency: {
      callResolution: 91.5,
      avgCallDuration: 180,
      noShowRate: 12.3,
      costPerCall: 2.45
    },
    predictions: {
      nextMonthRevenue: 49200,
      peakHours: ['09:00-11:00', '14:00-16:00'],
      staffingNeeds: 3,
      growthOpportunity: 23.5
    }
  });

  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'opportunity',
      title: 'Optimize Peak Hour Staffing',
      description: 'Your busiest hours (9-11 AM, 2-4 PM) show 23% higher call volume. AI optimization during these times could improve efficiency.',
      impact: 'high',
      action: 'Implement dynamic AI response tuning',
      potentialValue: '£2,400/month savings'
    },
    {
      id: '2',
      type: 'success',
      title: 'Patient Satisfaction Improvement',
      description: 'AI response quality increased by 15% this month, leading to higher patient satisfaction scores.',
      impact: 'medium',
      action: 'Continue current AI training regimen',
      potentialValue: '4.7/5 rating maintained'
    },
    {
      id: '3',
      type: 'warning',
      title: 'No-Show Rate Increasing',
      description: 'Appointment no-show rate has increased to 12.3%. Enhanced reminder system could help.',
      impact: 'medium',
      action: 'Implement multi-channel reminders',
      potentialValue: '£1,800/month recovered revenue'
    },
    {
      id: '4',
      type: 'opportunity',
      title: 'New Patient Acquisition',
      description: 'Your AI handles inquiries 40% faster than competitors. This is a key differentiator for marketing.',
      impact: 'high',
      action: 'Highlight AI efficiency in marketing',
      potentialValue: '25% more new patients'
    }
  ]);

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        efficiency: {
          ...prev.efficiency,
          callResolution: Math.min(100, prev.efficiency.callResolution + (Math.random() - 0.5) * 0.5)
        }
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Lightbulb;
      case 'warning': return TrendingDown;
      case 'success': return TrendingUp;
      default: return Brain;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Business Intelligence Dashboard</h2>
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`time-range-${range}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.revenue.current)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600">+{metrics.revenue.growth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{metrics.patients.total.toLocaleString()}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm text-blue-600">+{metrics.patients.newThisMonth} new</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Call Resolution</p>
                <p className="text-2xl font-bold">{metrics.efficiency.callResolution.toFixed(1)}%</p>
                <Progress value={metrics.efficiency.callResolution} className="mt-2 h-2" />
              </div>
              <Phone className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patient Satisfaction</p>
                <p className="text-2xl font-bold">{metrics.patients.satisfaction}/5</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600">Excellent</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Predictive Analytics & Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Revenue Forecast</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Predicted next month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.predictions.nextMonthRevenue)}
                  </p>
                  <p className="text-sm text-green-700">
                    +{((metrics.predictions.nextMonthRevenue / metrics.revenue.current - 1) * 100).toFixed(1)}% growth
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Peak Hours Analysis</h4>
                <div className="space-y-2">
                  {metrics.predictions.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">{hour}</span>
                      <Badge variant="outline">High Volume</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Growth Opportunities</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Potential improvement</p>
                  <p className="text-2xl font-bold text-blue-600">
                    +{metrics.predictions.growthOpportunity}%
                  </p>
                  <p className="text-sm text-blue-700">
                    Through AI optimization
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Efficiency Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Call Resolution Rate</span>
                      <span>{metrics.efficiency.callResolution.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.efficiency.callResolution} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Patient Retention</span>
                      <span>{metrics.patients.retention}%</span>
                    </div>
                    <Progress value={metrics.patients.retention} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI-Powered Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={insight.id}
                  className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge
                            variant={insight.impact === 'high' ? 'destructive' : 
                                    insight.impact === 'medium' ? 'default' : 'secondary'}
                          >
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600">{insight.potentialValue}</p>
                          <Button size="sm" variant="outline" data-testid={`insight-action-${insight.id}`}>
                            {insight.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Competitive Benchmarking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Response Time</h4>
              <p className="text-2xl font-bold text-green-600">2.3s</p>
              <p className="text-sm text-green-700">40% faster than average</p>
              <Badge variant="secondary" className="mt-2">Industry Leader</Badge>
            </div>
            
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Patient Satisfaction</h4>
              <p className="text-2xl font-bold text-blue-600">4.7/5</p>
              <p className="text-sm text-blue-700">Above industry average (4.2)</p>
              <Badge variant="secondary" className="mt-2">Top Performer</Badge>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800">Cost Efficiency</h4>
              <p className="text-2xl font-bold text-yellow-600">£2.45</p>
              <p className="text-sm text-yellow-700">Per call (60% below average)</p>
              <Badge variant="secondary" className="mt-2">Cost Leader</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Return on Investment (ROI) Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Monthly Cost Savings</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Traditional receptionist</span>
                  <span className="font-medium">£3,200/month</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>ClinicVoice AI</span>
                  <span className="font-medium">£199/month</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                  <span className="font-semibold">Monthly Savings</span>
                  <span className="font-bold text-green-600">£3,001</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Annual ROI Projection</h4>
              <div className="space-y-3">
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <p className="text-sm text-gray-600">Total Annual Savings</p>
                  <p className="text-3xl font-bold text-primary">£36,012</p>
                  <p className="text-sm text-gray-600 mt-2">1,806% ROI</p>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Reduced staffing costs: £28,800</p>
                  <p>• Improved efficiency: £4,200</p>
                  <p>• Reduced errors: £2,012</p>
                  <p>• 24/7 availability: £1,000</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}