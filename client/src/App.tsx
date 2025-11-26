import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/error-boundary";
import { HelpProvider, useHelp } from "@/components/help/help-provider";
import ContextualHelp from "@/components/help/contextual-help";
import VoiceFloatingButton from "@/components/voice/voice-floating-button";
import SessionTimeoutWarning from "@/components/session-timeout-warning";
import OfflineIndicator from "@/components/offline-indicator";
import Breadcrumb from "@/components/breadcrumb";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import SimpleDashboard from "@/components/simple-dashboard";
import CallLogs from "@/pages/call-logs";
import Appointments from "@/pages/appointments";
import AiConfig from "@/pages/ai-config";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminMonitoring from "@/pages/AdminMonitoring";
import DeveloperPortal from "@/pages/DeveloperPortal";
import AdvancedAnalytics from "@/pages/AdvancedAnalytics";
import EnhancedSettings from "@/pages/enhanced-settings";
import BusinessAnalytics from "@/pages/business-analytics";
import MobileApp from "@/pages/mobile-app";
import PrivacyPolicy from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import CookieConsent from "@/components/cookie-consent";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Minimal loading state to prevent rendering issues
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Always render routes, but conditionally show content
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/call-logs">
        {isAuthenticated ? <CallLogs /> : <Login />}
      </Route>
      <Route path="/appointments">
        {isAuthenticated ? <Appointments /> : <Login />}
      </Route>
      <Route path="/ai-config">
        {isAuthenticated ? <AiConfig /> : <Login />}
      </Route>
      <Route path="/settings">
        {isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/admin">
        {isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : <Login />}
      </Route>
      <Route path="/admin/monitoring">
        {isAuthenticated && user?.role === 'admin' ? <AdminMonitoring /> : <Login />}
      </Route>
      <Route path="/developer">
        {isAuthenticated ? <DeveloperPortal /> : <Login />}
      </Route>
      <Route path="/advanced-analytics">
        {isAuthenticated ? <AdvancedAnalytics /> : <Login />}
      </Route>
      <Route path="/enhanced-settings">
        {isAuthenticated ? <EnhancedSettings /> : <Login />}
      </Route>
      <Route path="/business-analytics">
        {isAuthenticated ? <BusinessAnalytics /> : <Login />}
      </Route>
      <Route path="/mobile">
        {isAuthenticated ? <MobileApp /> : <Login />}
      </Route>
      <Route path="/privacy">
        <PrivacyPolicy />
      </Route>
      <Route path="/">
        {!isAuthenticated ? (
          <Landing />
        ) : user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <Dashboard />
        )}
      </Route>
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-slate-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      data-testid="link-skip-navigation"
    >
      Skip to main content
    </a>
  );
}

function AppWithHelp() {
  const { isHelpVisible, isHelpMinimized, toggleHelpMinimize } = useHelp();

  return (
    <>
      <OfflineIndicator />
      <SkipNavigation />
      <main id="main-content">
        <Router />
      </main>
      <VoiceFloatingButton />
      <SessionTimeoutWarning />
      {isHelpVisible && (
        <ContextualHelp 
          isMinimized={isHelpMinimized}
          onToggleMinimize={toggleHelpMinimize}
        />
      )}
      <CookieConsent />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelpProvider>
          <TooltipProvider>
            <AppWithHelp />
            <Toaster />
          </TooltipProvider>
        </HelpProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
