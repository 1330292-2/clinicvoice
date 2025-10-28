import { createContext, useContext, useState, ReactNode } from "react";

interface HelpContextType {
  isHelpVisible: boolean;
  isHelpMinimized: boolean;
  showHelp: () => void;
  hideHelp: () => void;
  toggleHelpMinimize: () => void;
  triggerContextualHelp: (context?: string) => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

interface HelpProviderProps {
  children: ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [isHelpMinimized, setIsHelpMinimized] = useState(true);

  const showHelp = () => {
    setIsHelpVisible(true);
    setIsHelpMinimized(false);
  };

  const hideHelp = () => {
    setIsHelpVisible(false);
    setIsHelpMinimized(true);
  };

  const toggleHelpMinimize = () => {
    if (!isHelpVisible) {
      setIsHelpVisible(true);
    }
    setIsHelpMinimized(!isHelpMinimized);
  };

  const triggerContextualHelp = (context?: string) => {
    showHelp();
    // Additional logic for context-specific help can be added here
  };

  const value = {
    isHelpVisible,
    isHelpMinimized,
    showHelp,
    hideHelp,
    toggleHelpMinimize,
    triggerContextualHelp,
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}