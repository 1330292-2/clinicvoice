import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles } from "lucide-react";
import { useHelp } from "./help-provider";

interface HelpTriggerProps {
  context?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export default function HelpTrigger({ 
  context, 
  size = "sm", 
  variant = "ghost", 
  className = "" 
}: HelpTriggerProps) {
  const { triggerContextualHelp } = useHelp();

  const handleClick = () => {
    triggerContextualHelp(context);
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      className={`${sizeClasses[size]} ${className} group`}
      data-testid="help-trigger"
      title="Get AI help"
    >
      <div className="relative">
        <HelpCircle className={`${iconSizes[size]} transition-opacity group-hover:opacity-0`} />
        <Sparkles className={`${iconSizes[size]} absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 text-primary`} />
      </div>
    </Button>
  );
}