import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "call-logs": "Call Logs",
  "appointments": "Appointments",
  "ai-config": "AI Configuration",
  "settings": "Settings",
  "admin": "Admin Dashboard",
  "developer": "Developer Portal",
  "advanced-analytics": "Advanced Analytics",
  "enhanced-settings": "Enhanced Settings",
  "business-analytics": "Business Analytics",
  "mobile": "Mobile App",
  "privacy": "Privacy Policy",
};

export default function Breadcrumb() {
  const [location] = useLocation();
  
  if (location === "/" || location === "/login") return null;

  const segments = location.split("/").filter(Boolean);
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center text-sm text-slate-500 mb-4 print:hidden"
      data-testid="nav-breadcrumb"
    >
      <Link href="/" className="hover:text-slate-700 transition-colors flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        
        return (
          <span key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />
            {isLast ? (
              <span className="text-slate-900 font-medium">{label}</span>
            ) : (
              <Link href={path} className="hover:text-slate-700 transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
