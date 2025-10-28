import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { formatGBP, SUBSCRIPTION_PRICING, getSavingsPercentage } from "@/lib/currency";
import ApiConfiguration from "@/components/settings/api-configuration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  Save, 
  Building, 
  CreditCard, 
  Bell, 
  Shield,
  Trash2,
  ExternalLink,
  Crown
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Clinic, InsertClinic, User } from "@shared/schema";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [clinicData, setClinicData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
  });

  const { data: clinic, isLoading: clinicLoading, error } = useQuery<Clinic>({
    queryKey: ["/api/clinic"],
    retry: false,
  });

  const updateClinicMutation = useMutation({
    mutationFn: async (data: Partial<InsertClinic>) => {
      if (!clinic?.id) throw new Error("No clinic found");
      await apiRequest("PUT", `/api/clinic/${clinic.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic"] });
      toast({
        title: "Success",
        description: "Clinic settings updated successfully",
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
        description: "Failed to update clinic settings",
        variant: "destructive",
      });
    },
  });

  // Load clinic data into form
  useEffect(() => {
    if (clinic) {
      setClinicData({
        name: clinic.name || "",
        phoneNumber: clinic.phoneNumber || "",
        address: clinic.address || "",
      });
    }
  }, [clinic]);

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

  const handleClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicData.name.trim()) {
      toast({
        title: "Error",
        description: "Clinic name is required",
        variant: "destructive",
      });
      return;
    }

    updateClinicMutation.mutate({
      name: clinicData.name,
      phoneNumber: clinicData.phoneNumber || null,
      address: clinicData.address || null,
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDeleteAccount = () => {
    // In a real app, this would call a delete API
    toast({
      title: "Account Deletion",
      description: "Account deletion is not implemented in this demo. Please contact support.",
      variant: "destructive",
    });
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

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "pro":
        return "bg-primary/10 text-primary";
      case "premium":
        return "bg-accent/10 text-accent";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Settings" 
          description="Manage your clinic profile, subscription, and preferences."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Clinic Profile */}
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Clinic Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clinicLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <form onSubmit={handleClinicSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="clinicName">Clinic Name *</Label>
                      <Input
                        id="clinicName"
                        value={clinicData.name}
                        onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                        placeholder="Enter your clinic name"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={clinicData.phoneNumber}
                        onChange={(e) => setClinicData({ ...clinicData, phoneNumber: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={clinicData.address}
                        onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                        placeholder="Enter your clinic address"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateClinicMutation.isPending}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateClinicMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">Current Plan</span>
                      <Badge className={getSubscriptionBadgeColor(clinic?.subscriptionTier || "essential")}>
                        {clinic?.subscriptionTier === "essential" && <Crown className="h-3 w-3 mr-1" />}
                        {(clinic?.subscriptionTier || "essential").charAt(0).toUpperCase() + (clinic?.subscriptionTier || "essential").slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className="capitalize">{clinic?.subscriptionStatus || "trial"}</span>
                    </p>
                  </div>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Essential</h4>
                    <div className="mt-2">
                      <p className="text-2xl font-bold">{formatGBP(SUBSCRIPTION_PRICING.essential.monthly)}</p>
                      <p className="text-sm text-gray-500">/month</p>
                      <p className="text-xs text-green-600 mt-1">
                        Save {getSavingsPercentage(SUBSCRIPTION_PRICING.essential.monthly, SUBSCRIPTION_PRICING.essential.yearly)}% yearly
                      </p>
                    </div>
                    <ul className="text-sm text-gray-600 mt-3 space-y-1">
                      {SUBSCRIPTION_PRICING.essential.features.map((feature: string, index: number) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                    <Button 
                      variant={clinic?.subscriptionTier === "essential" ? "outline" : "default"}
                      className="w-full mt-4"
                      disabled={clinic?.subscriptionTier === "essential"}
                    >
                      {clinic?.subscriptionTier === "essential" ? "Current Plan" : "Downgrade"}
                    </Button>
                  </div>
                  
                  <div className="p-4 border-2 border-primary rounded-lg relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white">Most Popular</Badge>
                    </div>
                    <h4 className="font-medium">Professional</h4>
                    <div className="mt-2">
                      <p className="text-2xl font-bold">{formatGBP(SUBSCRIPTION_PRICING.professional.monthly)}</p>
                      <p className="text-sm text-gray-500">/month</p>
                      <p className="text-xs text-green-600 mt-1">
                        Save {getSavingsPercentage(SUBSCRIPTION_PRICING.professional.monthly, SUBSCRIPTION_PRICING.professional.yearly)}% yearly
                      </p>
                    </div>
                    <ul className="text-sm text-gray-600 mt-3 space-y-1">
                      {SUBSCRIPTION_PRICING.professional.features.map((feature: string, index: number) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                    <Button 
                      variant={clinic?.subscriptionTier === "professional" ? "outline" : "default"}
                      className="w-full mt-4"
                      disabled={clinic?.subscriptionTier === "professional"}
                    >
                      {clinic?.subscriptionTier === "professional" ? "Current Plan" : "Upgrade to Professional"}
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Enterprise</h4>
                    <div className="mt-2">
                      <p className="text-2xl font-bold">{formatGBP(SUBSCRIPTION_PRICING.enterprise.monthly)}</p>
                      <p className="text-sm text-gray-500">/month</p>
                      <p className="text-xs text-green-600 mt-1">
                        Save {getSavingsPercentage(SUBSCRIPTION_PRICING.enterprise.monthly, SUBSCRIPTION_PRICING.enterprise.yearly)}% yearly
                      </p>
                    </div>
                    <ul className="text-sm text-gray-600 mt-3 space-y-1">
                      {SUBSCRIPTION_PRICING.enterprise.features.map((feature: string, index: number) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                    <Button 
                      variant={clinic?.subscriptionTier === "enterprise" ? "outline" : "default"}
                      className="w-full mt-4"
                      disabled={clinic?.subscriptionTier === "enterprise"}
                    >
                      {clinic?.subscriptionTier === "enterprise" ? "Current Plan" : "Upgrade to Enterprise"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive email alerts for important events</p>
                  </div>
                  <Select defaultValue="important">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All notifications</SelectItem>
                      <SelectItem value="important">Important only</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New appointment bookings</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Missed calls</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System maintenance alerts</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly performance reports</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Security & Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{user?.email || "Not available"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account created:</span>
                      <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last updated:</span>
                      <span>{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Unknown"}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                  
                  <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <ApiConfiguration clinic={clinic || null} />

            {/* Danger Zone */}
            <Card className="border border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-red-500 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account,
                          clinic data, call logs, appointments, and all associated information.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
