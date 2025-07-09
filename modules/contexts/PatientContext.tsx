import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Contact } from './ContactsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import patientData from '../../config/patient.json';

export interface Patient {
  id: string;
  name: string;
  age: number;
  birthday: string;
  location: string;
  emergencyContacts: Contact[];
  medicalInfo: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  preferences: {
    accessibilityLevel: 'basic' | 'enhanced';
    communicationStyle: 'voice' | 'text' | 'both';
    calmModeEnabled: boolean;
  };
  family: {
    primaryCaregiver: Contact | null;
    familyMembers: Contact[];
  };
  personalDetails: {
    favoriteColor: string;
    favoriteAnimal: string;
    interests: string[];
  };
}

export interface PatientContextType {
  patient: Patient;
  isLoading: boolean;
  error: string | null;
  updatePatient: (updates: Partial<Patient>) => void;
  savePatientData: () => Promise<void>;
  loadPatientData: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const defaultPatient: Patient = patientData as Patient;

const validatePatientData = (data: Partial<Patient>): boolean => {
  // Add validation logic here
  return true;
};

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patient, setPatient] = useState<Patient>(defaultPatient);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const savePatientData = async (data?: Patient) => {
    setIsLoading(true);
    setError(null);
    try {
      await AsyncStorage.setItem('patientData', JSON.stringify(data || patient));
      setIsLoading(false);
    } catch (err) {
      setError('Failed to save patient data');
      setIsLoading(false);
      console.error('Failed to save patient data:', err);
    }
  };

  const updatePatient = (updates: Partial<Patient>) => {
    setPatient(prev => {
      const updated = { ...prev, ...updates };
      savePatientData(updated);
      return updated;
    });
  };

  const loadPatientData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedData = await AsyncStorage.getItem('patientData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setPatient(parsedData);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load patient data');
      setIsLoading(false);
      console.error('Failed to load patient data:', err);
    }
  };

  return (
    <PatientContext.Provider value={{ patient, isLoading, error, updatePatient, savePatientData, loadPatientData }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient must be used within a PatientProvider');
  return context;
}; 