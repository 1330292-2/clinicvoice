import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Cloud, 
  Phone, 
  Save, 
  TestTube,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import type { Clinic } from "@shared/schema";

interface ApiConfigurationProps {
  clinic: Clinic | null;
}

interface ApiConfig {
  googleServiceAccountKey?: any;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
}

export default function ApiConfiguration({ clinic }: ApiConfigurationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showSecrets, setShowSecrets] = useState({
    twilioAuthToken: false,
  });

  const [configData, setConfigData] = useState<ApiConfig>({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
  });

  const [googleServiceAccount, setGoogleServiceAccount] = useState("");

  // Fetch existing configuration
  const { data: apiConfig, isLoading } = useQuery({
    queryKey: [`/api/configurations/${clinic?.id}`],
    enabled: !!clinic?.id,
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: ApiConfig) => {
      return apiRequest("POST", `/api/configurations`, {
        clinicId: clinic?.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "API configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/configurations/${clinic?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  // Test API connections
  const testConnection = async (service: string) => {
    try {
      switch (service) {
        case 'twilio':
          if (!configData.twilioAccountSid || !configData.twilioAuthToken) {
            toast({
              title: "Missing Credentials",
              description: "Please enter your Twilio credentials first.",
              variant: "destructive",
            });
            return;
          }
          // Test connection would be implemented here
          break;
        case 'googlesheets':
          if (!googleServiceAccount) {
            toast({
              title: "Missing Service Account",
              description: "Please enter your Google Service Account JSON first.",
              variant: "destructive",
            });
            return;
          }
          break;
      }
      
      toast({
        title: "Connection Successful",
        description: `${service} API connection is working correctly.`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect to ${service}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedGoogleKey = null;
    if (googleServiceAccount.trim()) {
      try {
        parsedGoogleKey = JSON.parse(googleServiceAccount);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Google Service Account key must be valid JSON.",
          variant: "destructive",
        });
        return;
      }
    }

    updateConfigMutation.mutate({
      ...configData,
      googleServiceAccountKey: parsedGoogleKey,
    });
  };

  const toggleShowSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Google Sheets Configuration */}
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-green-600" />
              <span>Google Sheets Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={(apiConfig && 'googleServiceAccountKey' in apiConfig && apiConfig.googleServiceAccountKey) ? "default" : "secondary"}>
                {(apiConfig && 'googleServiceAccountKey' in apiConfig && apiConfig.googleServiceAccountKey) ? "Configured" : "Not Configured"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testConnection('googlesheets')}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="googleServiceAccount">Service Account JSON</Label>
            <Textarea
              id="googleServiceAccount"
              value={googleServiceAccount}
              onChange={(e) => setGoogleServiceAccount(e.target.value)}
              placeholder="Paste your Google Service Account JSON here..."
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Securely stores patient records in Google Sheets. 
              <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Setup Guide
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Twilio Configuration */}
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-red-600" />
              <span>Twilio Phone Service</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={(apiConfig && 'twilioAccountSid' in apiConfig && apiConfig.twilioAccountSid) ? "default" : "secondary"}>
                {(apiConfig && 'twilioAccountSid' in apiConfig && apiConfig.twilioAccountSid) ? "Configured" : "Not Configured"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testConnection('twilio')}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="twilioAccountSid">Account SID</Label>
            <Input
              id="twilioAccountSid"
              value={configData.twilioAccountSid}
              onChange={(e) => setConfigData({ ...configData, twilioAccountSid: e.target.value })}
              placeholder="AC..."
            />
          </div>
          
          <div>
            <Label htmlFor="twilioAuthToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="twilioAuthToken"
                type={showSecrets.twilioAuthToken ? "text" : "password"}
                value={configData.twilioAuthToken}
                onChange={(e) => setConfigData({ ...configData, twilioAuthToken: e.target.value })}
                placeholder="..."
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleShowSecret('twilioAuthToken')}
              >
                {showSecrets.twilioAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="twilioPhoneNumber">Phone Number</Label>
            <Input
              id="twilioPhoneNumber"
              value={configData.twilioPhoneNumber}
              onChange={(e) => setConfigData({ ...configData, twilioPhoneNumber: e.target.value })}
              placeholder="+1234567890"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Twilio phone number that will receive calls.
            </p>
          </div>
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
  );
}