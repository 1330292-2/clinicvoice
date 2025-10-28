import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  PlayCircle, 
  BarChart3, 
  Globe, 
  Shield, 
  Volume2, 
  Settings,
  Plus,
  Clock,
  ChartLine 
} from "lucide-react";
import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import QuickActions from "@/components/dashboard/quick-actions";

export default function SimpleDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" description="AI-powered healthcare management" />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to ClinicVoice
              </h1>
              <p className="text-gray-600 mt-2">
                Your AI-powered healthcare receptionist platform
              </p>
              {user && (
                <p className="text-sm text-gray-500 mt-1">
                  Logged in as: {user.email}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <QuickActions clinic={null} />

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlayCircle className="h-5 w-5 mr-2 text-green-600" />
                    Interactive Demos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Test your AI receptionist with realistic conversation simulations
                  </p>
                  <Button variant="outline" className="w-full">
                    Try Demo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    View comprehensive performance metrics and insights
                  </p>
                  <Button variant="outline" className="w-full">
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Emergency Protocols
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Test critical situation handling and safety measures
                  </p>
                  <Button variant="outline" className="w-full">
                    Test Protocols
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                    Multi-Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Support for 8+ languages with natural pronunciation
                  </p>
                  <Button variant="outline" className="w-full">
                    Try Languages
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume2 className="h-5 w-5 mr-2 text-orange-600" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Customize speech speed, pitch, and personality
                  </p>
                  <Button variant="outline" className="w-full">
                    Customize Voice
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-gray-600" />
                    Integration Testing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Validate all system connections and API health
                  </p>
                  <Button variant="outline" className="w-full">
                    Run Tests
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Application</p>
                    <p className="text-xs text-gray-600">Online</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Authentication</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Simulations</p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}