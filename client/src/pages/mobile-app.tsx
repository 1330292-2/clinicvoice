import { useState, useEffect } from "react";
import MobileDashboard from "@/components/mobile/mobile-dashboard";
import { useAuth } from "@/hooks/useAuth";

export default function MobileApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // For desktop users, redirect to main dashboard
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Mobile View</h1>
          <p className="text-gray-600 mb-6">
            This page is optimized for mobile devices. Please resize your browser window 
            or visit on a mobile device to see the mobile interface.
          </p>
          <a 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Desktop Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <MobileDashboard />;
}