import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    // Load from localStorage if available, default to false
    const stored = localStorage.getItem('devMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    // Persist to localStorage whenever it changes
    localStorage.setItem('devMode', JSON.stringify(isDevMode));
  }, [isDevMode]);

  const setDevMode = (enabled: boolean) => {
    setIsDevMode(enabled);
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};
