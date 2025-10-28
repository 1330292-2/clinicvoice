import { ReactNode } from "react";
import medicalBgImage from "@assets/generated_images/Medical_stethoscope_background_image_4538622b.png";

interface PageBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function PageBackground({ children, className = "" }: PageBackgroundProps) {
  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-blue-50/80 via-white to-green-50/80 relative ${className}`}
      style={{
        backgroundImage: `url(${medicalBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}