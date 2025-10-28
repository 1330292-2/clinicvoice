import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Calendar, 
  Phone, 
  Settings, 
  Brain, 
  ChartLine,
  Stethoscope,
  MoreVertical,
  Code,
  TrendingUp
} from "lucide-react";
import type { Clinic } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Call Logs", href: "/call-logs", icon: Phone },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Business Analytics", href: "/business-analytics", icon: BarChart3 },
  { name: "Advanced Analytics", href: "/advanced-analytics", icon: TrendingUp },
  { name: "Developer Portal", href: "/developer", icon: Code },
  { name: "AI Configuration", href: "/ai-config", icon: Brain },
  { name: "Enhanced Settings", href: "/enhanced-settings", icon: Settings },
  { name: "Settings", href: "/settings", icon: MoreVertical },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  // PERMANENTLY DISABLED - Use static clinic data
  const clinic: { name?: string; subscriptionTier?: string } | null = null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Clinic Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="text-white text-lg" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {clinic?.name || "Your Clinic"}
            </h2>
            <p className="text-sm text-gray-500 capitalize">
              {clinic?.subscriptionTier || "Basic"} Plan
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {user?.firstName && user?.lastName
                ? getInitials(`${user.firstName} ${user.lastName}`)
                : user?.email
                ? getInitials(user.email)
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
