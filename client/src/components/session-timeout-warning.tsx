import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in production
const WARNING_BEFORE = 2 * 60 * 1000; // Show warning 2 minutes before
const WARNING_AT = SESSION_TIMEOUT - WARNING_BEFORE;

export default function SessionTimeoutWarning() {
  const { isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE / 1000);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    setTimeLeft(WARNING_BEFORE / 1000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let warningTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const startTimers = () => {
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        countdownInterval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, WARNING_AT);
    };

    const handleActivity = () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      resetTimer();
      startTimers();
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    startTimers();

    return () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, resetTimer]);

  const handleStayLoggedIn = () => {
    resetTimer();
    fetch("/api/auth/refresh", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isAuthenticated || !showWarning) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent className="max-w-md" data-testid="dialog-session-warning">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            For your security, you'll be logged out in{" "}
            <span className="font-bold text-amber-600">{formatTime(timeLeft)}</span>.
            <br /><br />
            Click below to stay logged in, or any activity will reset the timer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleStayLoggedIn} data-testid="button-stay-logged-in">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
