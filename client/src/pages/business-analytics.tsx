import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BusinessIntelligence from "@/components/analytics/business-intelligence";
import { 
  TrendingUp, 
  Brain, 
  Target, 
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Users
} from "lucide-react";

export default function BusinessAnalytics() {
  const [activeTab, setActiveTab] = useState("intelligence");

  const tabs = [
    {
      id: "intelligence",
      label: "Business Intelligence",
      icon: Brain,
      component: <BusinessIntelligence />
    },
    {
      id: "performance",
      label: "Performance Analytics",
      icon: TrendingUp,
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Analytics Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced performance analytics and reporting features will be available here.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "forecasting",
      label: "Predictive Analytics",
      icon: Target,
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Predictive Analytics Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered forecasting and predictive insights will be available here.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "reports",
      label: "Custom Reports",
      icon: BarChart3,
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Custom Reports Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build and customize your own reports and dashboards here.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Business Analytics" 
          description="AI-powered insights and business intelligence for your practice"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center space-x-2"
                    data-testid={`analytics-tab-${tab.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}