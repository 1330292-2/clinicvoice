import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Brain, Save } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { AiConfiguration } from "@shared/schema";

export default function AiConfig() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    greetingMessage: "",
    personalityTraits: "",
    businessHours: {
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: false },
      saturday: { open: "09:00", close: "17:00", closed: true },
      sunday: { open: "09:00", close: "17:00", closed: true },
    },
    services: [] as string[],
    newService: "",
  });

  const { data: aiConfig, isLoading: configLoading, error } = useQuery<AiConfiguration>({
    queryKey: ["/api/ai-configuration"],
    retry: false,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<AiConfiguration>) => {
      if (!aiConfig?.id) throw new Error("No configuration found");
      await apiRequest("PUT", `/api/ai-configuration/${aiConfig.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-configuration"] });
      toast({
        title: "Success",
        description: "AI configuration updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update AI configuration",
        variant: "destructive",
      });
    },
  });

  // Load configuration data into form
  useEffect(() => {
    if (aiConfig) {
      setFormData({
        greetingMessage: aiConfig.greetingMessage || "",
        personalityTraits: aiConfig.personalityTraits || "",
        businessHours: (aiConfig.businessHours as any) || formData.businessHours,
        services: (aiConfig.services as string[]) || [],
        newService: "",
      });
    }
  }, [aiConfig]);

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateConfigMutation.mutate({
      greetingMessage: formData.greetingMessage,
      personalityTraits: formData.personalityTraits,
      businessHours: formData.businessHours,
      services: formData.services,
    });
  };

  const handleBusinessHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value,
        },
      },
    }));
  };

  const addService = () => {
    if (formData.newService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, prev.newService.trim()],
        newService: "",
      }));
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const days = [
    "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday"
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="AI Configuration" 
          description="Customize your AI assistant's behavior and responses."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {configLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Greeting Message */}
              <Card className="border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span>Greeting Message</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="greetingMessage">
                      Initial greeting for incoming calls
                    </Label>
                    <Textarea
                      id="greetingMessage"
                      value={formData.greetingMessage}
                      onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                      placeholder="Hello! Thank you for calling. How can I help you today?"
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Personality Traits */}
              <Card className="border border-gray-100">
                <CardHeader>
                  <CardTitle>Personality & Tone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="personalityTraits">
                      AI personality traits (comma-separated)
                    </Label>
                    <Input
                      id="personalityTraits"
                      value={formData.personalityTraits}
                      onChange={(e) => setFormData({ ...formData, personalityTraits: e.target.value })}
                      placeholder="professional, empathetic, helpful"
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Define how your AI assistant should speak and behave during calls
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="border border-gray-100">
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {days.map((day) => {
                    const dayData = formData.businessHours[day as keyof typeof formData.businessHours];
                    
                    return (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24 text-sm font-medium capitalize">
                          {day}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!dayData.closed}
                            onCheckedChange={(checked) => 
                              handleBusinessHoursChange(day, "closed", !checked)
                            }
                          />
                          <span className="text-sm text-gray-600">Open</span>
                        </div>
                        {!dayData.closed && (
                          <>
                            <Input
                              type="time"
                              value={dayData.open}
                              onChange={(e) => 
                                handleBusinessHoursChange(day, "open", e.target.value)
                              }
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={dayData.close}
                              onChange={(e) => 
                                handleBusinessHoursChange(day, "close", e.target.value)
                              }
                              className="w-32"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Services */}
              <Card className="border border-gray-100">
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={formData.newService}
                      onChange={(e) => setFormData({ ...formData, newService: e.target.value })}
                      placeholder="Add a service (e.g., General Checkup)"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                    />
                    <Button
                      type="button"
                      onClick={addService}
                      disabled={!formData.newService.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.services.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Services:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.services.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gray-100 rounded-lg px-3 py-1 text-sm"
                          >
                            <span>{service}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-auto p-0 text-gray-500 hover:text-red-500"
                              onClick={() => removeService(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
