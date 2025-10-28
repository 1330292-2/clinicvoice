import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Building2, 
  Phone, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Settings,
  MoreHorizontal,
  Activity,
  CreditCard,
  UserCheck,
  PhoneCall
} from "lucide-react";
import { formatGBP } from "@/lib/currency";
import type { Clinic, User, PlatformAnalytics } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Verify admin access
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch platform analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  // Fetch all clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ["/api/admin/clinics"],
  });

  // Fetch platform stats
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/platform-stats"],
  });

  const filteredClinics = clinics?.filter((clinic: Clinic) =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "trial":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "basic":
        return <Badge variant="outline">Basic</Badge>;
      case "premium":
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case "enterprise":
        return <Badge className="bg-blue-100 text-blue-800">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  if (analyticsLoading || clinicsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Platform overview and clinic management</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Platform Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats?.totalClinics || 0}</div>
                  <p className="text-xs text-green-600">
                    +{platformStats?.newSignups || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clinics</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats?.activeClinics || 0}</div>
                  <p className="text-xs text-gray-600">
                    {Math.round(((platformStats?.activeClinics || 0) / (platformStats?.totalClinics || 1)) * 100)}% retention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <PhoneCall className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats?.totalCalls?.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-600">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatGBP(platformStats?.totalRevenue || 0)}</div>
                  <p className="text-xs text-green-600">
                    +12% vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Signups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clinics?.slice(0, 5).map((clinic: Clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-sm text-gray-600">{clinic.email}</p>
                      </div>
                      <div className="text-right">
                        {getTierBadge(clinic.subscriptionTier)}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(clinic.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Top Performing Clinics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clinics?.sort((a: Clinic, b: Clinic) => (b.totalCalls || 0) - (a.totalCalls || 0)).slice(0, 5).map((clinic: Clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-sm text-gray-600">{clinic.totalCalls} calls</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(clinic.subscriptionStatus)}
                        <p className="text-xs text-gray-500 mt-1">
                          {clinic.totalAppointments} appointments
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clinics Tab */}
          <TabsContent value="clinics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search clinics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Clinics
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Clinics ({filteredClinics.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Clinic</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Plan</th>
                        <th className="text-left py-3 px-4 font-medium">Calls</th>
                        <th className="text-left py-3 px-4 font-medium">Revenue</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClinics.map((clinic: Clinic) => (
                        <tr key={clinic.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{clinic.name}</p>
                              <p className="text-sm text-gray-600">{clinic.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(clinic.subscriptionStatus)}
                          </td>
                          <td className="py-3 px-4">
                            {getTierBadge(clinic.subscriptionTier)}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{clinic.totalCalls}</p>
                              <p className="text-sm text-gray-600">{clinic.monthlyCallsUsed} this month</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{formatGBP(clinic.subscriptionTier === 'basic' ? 49 : clinic.subscriptionTier === 'premium' ? 149 : 299)}</p>
                            <p className="text-sm text-gray-600">per month</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm">{new Date(clinic.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>New Signups (30d)</span>
                      <span className="font-semibold text-green-600">+{platformStats?.newSignups || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Churn Rate</span>
                      <span className="font-semibold text-red-600">{platformStats?.churnedClinics || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Call Duration</span>
                      <span className="font-semibold">{Math.round((platformStats?.averageCallDuration || 0) / 60)}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Appointments</span>
                      <span className="font-semibold">{platformStats?.totalAppointments?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Calls per Clinic (avg)</span>
                      <span className="font-semibold">{Math.round((platformStats?.totalCalls || 0) / (platformStats?.activeClinics || 1))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>System Uptime</span>
                      <span className="font-semibold text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Monthly Recurring Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatGBP(platformStats?.totalRevenue || 0)}</div>
                  <p className="text-sm text-green-600">+12% vs last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Annual Run Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatGBP((platformStats?.totalRevenue || 0) * 12)}</div>
                  <p className="text-sm text-gray-600">Projected annually</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">98.5%</div>
                  <p className="text-sm text-green-600">Above industry average</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Enterprise Plan</p>
                      <p className="text-sm text-gray-600">{clinics?.filter((c: Clinic) => c.subscriptionTier === 'enterprise').length || 0} subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatGBP((clinics?.filter((c: Clinic) => c.subscriptionTier === 'enterprise').length || 0) * 299)}</p>
                      <p className="text-sm text-gray-600">per month</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Plan</p>
                      <p className="text-sm text-gray-600">{clinics?.filter((c: Clinic) => c.subscriptionTier === 'premium').length || 0} subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatGBP((clinics?.filter((c: Clinic) => c.subscriptionTier === 'premium').length || 0) * 149)}</p>
                      <p className="text-sm text-gray-600">per month</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Basic Plan</p>
                      <p className="text-sm text-gray-600">{clinics?.filter((c: Clinic) => c.subscriptionTier === 'basic').length || 0} subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatGBP((clinics?.filter((c: Clinic) => c.subscriptionTier === 'basic').length || 0) * 49)}</p>
                      <p className="text-sm text-gray-600">per month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}