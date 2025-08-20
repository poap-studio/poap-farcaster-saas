"use client";

import { createContext, useContext, ReactNode } from "react";

interface Drop {
  id: string;
  slug: string;
  poapEventId: string;
  poapSecretCode: string;
  buttonColor: string;
  backgroundColor: string;
  logoUrl?: string;
  mintMessage: string;
  requireFollow: boolean;
  followUsername?: string;
  requireRecast: boolean;
}

interface DropContextType {
  drop: Drop | null;
}

const DropContext = createContext<DropContextType>({ drop: null });

export function useDropContext() {
  const context = useContext(DropContext);
  if (!context) {
    throw new Error("useDropContext must be used within DropProvider");
  }
  return context;
}

export function DropProvider({ children, drop }: { children: ReactNode; drop: Drop | null }) {
  return (
    <DropContext.Provider value={{ drop }}>
      {children}
    </DropContext.Provider>
  );
}