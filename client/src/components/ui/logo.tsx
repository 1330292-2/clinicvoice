import { Stethoscope } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { wrapper: "h-9 w-9", icon: "h-8 w-8", iconInner: "h-5 w-5", text: "text-xl", tagline: "text-[10px]" },
    md: { wrapper: "h-12 w-12", icon: "h-11 w-11", iconInner: "h-6 w-6", text: "text-2xl", tagline: "text-xs" },
    lg: { wrapper: "h-16 w-16", icon: "h-14 w-14", iconInner: "h-8 w-8", text: "text-3xl", tagline: "text-xs" },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="logo">
      <div className={`${sizes[size].wrapper} relative`}>
        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-md opacity-40`} />
        <div className={`${sizes[size].icon} relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 flex items-center justify-center shadow-xl ring-1 ring-white/10`}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/5" />
          <Stethoscope className={`${sizes[size].iconInner} text-white drop-shadow-lg relative z-10`} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${sizes[size].text} font-black tracking-tight`}>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Vital</span>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Relay</span>
          </span>
          {size === "lg" && (
            <span className={`${sizes[size].tagline} text-slate-500 font-semibold tracking-widest uppercase`}>AI Healthcare Voice</span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-40" />
      <div className="relative h-full w-full rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 flex items-center justify-center shadow-xl ring-1 ring-white/10">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/5" />
        <Stethoscope className="h-[55%] w-[55%] text-white drop-shadow-lg relative z-10" />
      </div>
    </div>
  );
}
