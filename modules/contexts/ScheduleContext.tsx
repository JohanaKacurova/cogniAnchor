import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    {
      id: '1',
      date: '2024-06-11',
      time: '08:00',
      activityName: 'Breakfast',
      description: 'Morning meal with family',
      reminderType: 'both',
      repeatOption: 'daily',
    },
    {
      id: '2',
      date: '2024-06-11',
      time: '10:00',
      activityName: 'Take Medication',
      description: 'Morning pills with water',
      reminderType: 'voice',
      repeatOption: 'daily',
    },
    {
      id: '3',
      date: '2024-06-11',
      time: '15:00',
      activityName: 'Walk with Sarah',
      description: 'Afternoon walk in the park',
      assignedContact: '1',
      reminderType: 'both',
      repeatOption: 'none',
    },
    {
      id: '4',
      date: '2024-06-12',
      time: '09:00',
      activityName: 'Morning Exercise',
      description: 'Light stretching routine',
      reminderType: 'visual',
      repeatOption: 'daily',
    },
  ]);

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