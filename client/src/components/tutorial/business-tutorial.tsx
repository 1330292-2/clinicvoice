import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Calendar, 
  BarChart3, 
  Settings,
  Mic,
  FileText,
  CheckCircle,
  Play
} from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: any;
  content: string;
  tips?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to ClinicVoice",
    description: "Your AI-powered receptionist for healthcare clinics",
    icon: Phone,
    content: "ClinicVoice transforms how your clinic handles phone calls. Our AI receptionist works 24/7 to answer calls, book appointments, and provide information to patients - all while maintaining the professional standards your clinic requires.",
    tips: [
      "Available 24/7 - never miss a call again",
      "Handles multiple calls simultaneously",
      "Integrates with your existing systems"
    ]
  },
  {
    title: "Smart Call Management",
    description: "AI handles calls with natural conversation",
    icon: Mic,
    content: "Your AI receptionist uses advanced voice technology to have natural conversations with patients. It can understand accents, handle complex requests, and escalate to human staff when needed.",
    tips: [
      "Understands medical terminology",
      "Handles appointment booking automatically",
      "Records and transcribes all conversations"
    ]
  },
  {
    title: "Appointment Booking",
    description: "Automatic scheduling that syncs with your calendar",
    icon: Calendar,
    content: "Patients can book appointments directly through phone calls. The AI checks availability, confirms details, and updates your schedule in real-time. All patient information is securely stored in Google Sheets.",
    tips: [
      "Real-time calendar synchronization",
      "Automatic confirmation messages",
      "Patient data stored securely in Google Sheets"
    ]
  },
  {
    title: "Patient Records Integration",
    description: "Secure storage with Google Sheets",
    icon: FileText,
    content: "All patient interactions are automatically logged to Google Sheets for secure storage and easy access. This includes appointment details, call transcripts, and patient preferences.",
    tips: [
      "GDPR compliant data handling",
      "Easy export and backup",
      "Accessible from anywhere"
    ]
  },
  {
    title: "Analytics & Insights",
    description: "Track performance and improve service",
    icon: BarChart3,
    content: "Monitor call volumes, appointment conversion rates, and patient satisfaction. Use these insights to optimize your clinic's operations and improve patient experience.",
    tips: [
      "Track conversion rates",
      "Monitor patient satisfaction",
      "Identify peak call times"
    ]
  },
  {
    title: "Configuration & Setup",
    description: "Customize your AI receptionist",
    icon: Settings,
    content: "Personalize your AI receptionist with custom greetings, business hours, services offered, and voice preferences. Configure integrations with ElevenLabs for voice generation and Twilio for phone services.",
    tips: [
      "Custom voice and personality",
      "Set your business hours",
      "Configure available services"
    ]
  }
];

interface BusinessTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BusinessTutorial({ open, onOpenChange }: BusinessTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onOpenChange(false);
  };

  const currentTutorial = tutorialSteps[currentStep];
  const Icon = currentTutorial.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {currentTutorial.title}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  {currentTutorial.description}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">
              {currentStep + 1} of {tutorialSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-base">
                {currentTutorial.content}
              </p>
            </div>

            {/* Tips */}
            {currentTutorial.tips && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Key Benefits
                </h4>
                <ul className="space-y-2">
                  {currentTutorial.tips.map((tip, index) => (
                    <li key={index} className="flex items-start text-blue-800 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Demo Video Placeholder for first step */}
            {currentStep === 0 && (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Watch Demo Video</h4>
                    <p className="text-gray-600 text-sm">
                      See ClinicVoice in action - handling real patient calls
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Play Demo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === tutorialSteps.length - 1 ? (
            <Button onClick={handleClose}>
              Get Started
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}