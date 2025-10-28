import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle } from "lucide-react";
import HelpTrigger from "@/components/help/help-trigger";
import BusinessTutorial from "@/components/tutorial/business-tutorial";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Live Call Status */}
            <Badge variant="secondary" className="bg-success/10 text-success">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-2" />
              AI Online
            </Badge>
            
            {/* Demo Tutorial Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTutorialOpen(true)}
              className="text-primary border-primary hover:bg-primary hover:text-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Demo
            </Button>
            
            {/* AI Help Trigger */}
            <HelpTrigger 
              context="header" 
              variant="outline"
              size="sm"
              className="ml-2"
            />
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-gray-400 hover:text-gray-600"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </header>

      <BusinessTutorial 
        open={tutorialOpen} 
        onOpenChange={setTutorialOpen} 
      />
    </>
  );
}
