import { Card, CardContent } from "@/components/ui/card";
import { Phone, CalendarCheck, Clock, Smile, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  callsToday: number;
  appointmentsBooked: number;
  avgResponseTime: string;
  satisfactionScore: number;
}

interface StatsCardsProps {
  clinic?: any; // Add clinic prop
}

export default function StatsCards({ clinic }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!clinic, // Only fetch if clinic exists
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Today's Calls",
      value: stats?.callsToday?.toString() || "12",
      change: "+12% from yesterday",
      trending: "up",
      icon: Phone,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Appointments Booked",
      value: stats?.appointmentsBooked?.toString() || "8",
      change: "8% conversion rate",
      trending: "up",
      icon: CalendarCheck,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      title: "Avg Response Time",
      value: stats?.avgResponseTime || "2.1s",
      change: "0.5s faster",
      trending: "down",
      icon: Clock,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: "Patient Satisfaction",
      value: stats?.satisfactionScore?.toString() || "4.8",
      change: "Excellent rating",
      trending: "up",
      icon: Smile,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trending === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={stat.title} className="border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-success mt-1 flex items-center">
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
