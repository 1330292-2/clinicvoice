import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center px-4 max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl mb-6">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-7xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Page not found</h2>
          <p className="text-slate-500 mb-8">
            Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-slate-900 hover:bg-slate-800 w-full sm:w-auto" data-testid="button-go-home">
              <Home className="h-4 w-4 mr-2" />
              Go to homepage
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
