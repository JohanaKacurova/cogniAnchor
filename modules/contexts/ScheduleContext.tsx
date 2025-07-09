import React, { createContext, useContext, useState, ReactNode } from 'react';
import scheduleData from '../../config/schedule.json';

export interface ScheduleEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  activityName: string;
  description?: string;
  assignedContact?: string;
  reminderType: 'voice' | 'visual' | 'both';
  repeatOption: 'none' | 'daily' | 'weekly';
  voicePromptUrl?: string; // Optional URL or local path to audio file
}

interface ScheduleContextType {
  scheduleEntries: ScheduleEntry[];
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  getEntriesForDate: (date: string) => ScheduleEntry[];
  hasEntriesForDate: (date: string) => boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(scheduleData as ScheduleEntry[]);

  const addScheduleEntry = (newEntry: Omit<ScheduleEntry, 'id'>) => {
    const id = Date.now().toString();
    setScheduleEntries(prev => [...prev, { ...newEntry, id }]);
  };

  const updateScheduleEntry = (id: string, updatedEntry: Partial<ScheduleEntry>) => {
    setScheduleEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    ));
  };

  const deleteScheduleEntry = (id: string) => {
    setScheduleEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const getEntriesForDate = (date: string) => {
    return scheduleEntries.filter(entry => entry.date === date);
  };

  const hasEntriesForDate = (date: string) => {
    return scheduleEntries.some(entry => entry.date === date);
  };

  return (
    <ScheduleContext.Provider value={{ 
      scheduleEntries,
      addScheduleEntry,
      updateScheduleEntry,
      deleteScheduleEntry,
      getEntriesForDate,
      hasEntriesForDate
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}