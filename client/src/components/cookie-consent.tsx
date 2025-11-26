import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Cookie, Settings, Shield, X } from "lucide-react";
import { Link } from "wouter";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "clinicvoice_cookie_consent";
const COOKIE_PREFERENCES_KEY = "clinicvoice_cookie_preferences";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch (e) {
          console.error("Failed to parse cookie preferences");
        }
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleOpenPreferences = () => {
    setShowPreferences(true);
  };

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {showBanner && !showPreferences && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-500"
          role="dialog"
          aria-label="Cookie consent"
          data-testid="cookie-banner"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Cookie className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">We value your privacy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We use cookies to enhance your browsing experience, provide personalized content, 
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                    Read our{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    for more information.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  onClick={handleRejectNonEssential}
                  className="flex-1 lg:flex-none"
                  data-testid="button-reject-cookies"
                >
                  Reject Non-Essential
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenPreferences}
                  className="flex-1 lg:flex-none"
                  data-testid="button-manage-cookies"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Preferences
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 lg:flex-none bg-slate-900 hover:bg-slate-800"
                  data-testid="button-accept-cookies"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-lg" data-testid="cookie-preferences-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences below. Essential cookies are required for the 
              platform to function and cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="font-medium text-slate-900">Essential Cookies</Label>
                      <p className="text-sm text-slate-600">Required for security and authentication</p>
                    </div>
                  </div>
                  <Switch 
                    checked={true} 
                    disabled 
                    aria-label="Essential cookies (always enabled)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-slate-900">Functional Cookies</Label>
                    <p className="text-sm text-slate-600">Remember preferences and settings</p>
                  </div>
                  <Switch 
                    checked={preferences.functional}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, functional: checked }))
                    }
                    aria-label="Functional cookies"
                    data-testid="switch-functional-cookies"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-slate-900">Analytics Cookies</Label>
                    <p className="text-sm text-slate-600">Help us improve our service</p>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    }
                    aria-label="Analytics cookies"
                    data-testid="switch-analytics-cookies"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-slate-900">Marketing Cookies</Label>
                    <p className="text-sm text-slate-600">Personalized advertisements</p>
                  </div>
                  <Switch 
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, marketing: checked }))
                    }
                    aria-label="Marketing cookies"
                    data-testid="switch-marketing-cookies"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreferences(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePreferences}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800"
              data-testid="button-save-preferences"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
