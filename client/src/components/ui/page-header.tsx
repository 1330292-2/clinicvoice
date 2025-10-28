import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backTo?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  showBackButton = true, 
  backTo,
  children 
}: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backTo) {
      setLocation(backTo);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/'); // Fallback to dashboard
    }
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-1"
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid={`heading-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground" data-testid="page-description">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}