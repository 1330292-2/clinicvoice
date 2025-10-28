import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NaturalLanguageConfig from "@/components/settings/natural-language-config";
import SmartNotifications from "@/components/notifications/smart-notifications";
import PracticeManagementIntegrations from "@/components/integrations/practice-management";
import WorkflowAutomation from "@/components/automation/workflow-automation";
import { 
  Settings, 
  Brain, 
  Bell, 
  Link, 
  Zap,
  Shield,
  Database,
  Users
} from "lucide-react";

export default function EnhancedSettings() {
  const [activeTab, setActiveTab] = useState("ai-config");

  const tabs = [
    {
      id: "ai-config",
      label: "AI Configuration",
      icon: Brain,
      component: <NaturalLanguageConfig />
    },
    {
      id: "notifications",
      label: "Smart Notifications",
      icon: Bell,
      component: <SmartNotifications />
    },
    {
      id: "integrations",
      label: "Practice Integration",
      icon: Link,
      component: <PracticeManagementIntegrations />
    },
    {
      id: "automation",
      label: "Workflow Automation",
      icon: Zap,
      component: <WorkflowAutomation />
    }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Enhanced Settings" 
          description="Configure your AI receptionist and practice management tools"
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
                    data-testid={`settings-tab-${tab.id}`}
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