import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PatientContextType {
  name: string;
  setName: (name: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  // Default name can be replaced by a settings/profile screen
  const [name, setName] = useState('Margaret');
  return (
    <PatientContext.Provider value={{ name, setName }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient must be used within a PatientProvider');
  return context;
}; 