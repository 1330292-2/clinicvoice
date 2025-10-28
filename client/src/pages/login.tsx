import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Shield, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-white to-white"></div>
      
      <div className="w-full max-w-md relative">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl mb-6">
            <Stethoscope className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            ClinicVoice
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            AI-Powered Healthcare Management
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-600">
                Sign in to access your clinic dashboard
              </p>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg py-6 rounded-xl font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              data-testid="button-login"
            >
              <Lock className="h-5 w-5 mr-3" />
              Sign in with Replit
              <ArrowRight className="h-5 w-5 ml-3" />
            </Button>

            {/* Security Features */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center mb-4 font-medium">
                Secured with enterprise-grade authentication
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 mr-1.5 text-emerald-500" />
                  <span>SOC 2 Certified</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-3 w-3 mr-1.5 text-emerald-500" />
                  <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Don't have an account?{" "}
            <a 
              href="/" 
              className="text-slate-900 font-semibold hover:underline"
              data-testid="link-signup"
            >
              Sign up for free
            </a>
          </p>
        </div>

        {/* Background Decoration */}
        <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl opacity-60"></div>
      </div>
    </div>
  );
}
