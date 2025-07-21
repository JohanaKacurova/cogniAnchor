import React, { createContext, useContext, useState, ReactNode } from 'react';
import scheduleData from '../../config/schedule.json';

export interface VoicePromptMeta {
  uri: string; // Local or remote URI
  contactId?: string; // ID of the family member/caregiver
  duration?: number; // Duration in seconds
  context?: 'encouraging' | 'calming' | 'reminder' | 'custom'; // Emotional context
  tag?: string; // e.g., 'Birthday', 'Holiday', 'Morning', etc.
  timestamp?: string; // ISO string for when the prompt was recorded/added
}

export interface ScheduleEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  activityName: string;
  description?: string;
  assignedContact?: string;
  reminderType: 'voice' | 'visual' | 'both';
  repeatOption: 'none' | 'daily' | 'weekly';
  voicePrompts?: VoicePromptMeta[]; // Array of voice prompts with metadata
}

interface ScheduleContextType {
  scheduleEntries: ScheduleEntry[];
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  getEntriesForDate: (date: string) => ScheduleEntry[];
  hasEntriesForDate: (date: string) => boolean;
  addVoicePrompt: (entryId: string, prompt: VoicePromptMeta) => void;
  updateVoicePrompt: (entryId: string, promptIndex: number, prompt: VoicePromptMeta) => void;
  deleteVoicePrompt: (entryId: string, promptIndex: number) => void;
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

  const addVoicePrompt = (entryId: string, prompt: VoicePromptMeta) => {
    setScheduleEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, voicePrompts: [...(entry.voicePrompts || []), prompt] }
        : entry
    ));
  };

  const updateVoicePrompt = (entryId: string, promptIndex: number, prompt: VoicePromptMeta) => {
    setScheduleEntries(prev => prev.map(entry => {
      if (entry.id !== entryId || !entry.voicePrompts) return entry;
      const newPrompts = [...entry.voicePrompts];
      newPrompts[promptIndex] = prompt;
      return { ...entry, voicePrompts: newPrompts };
    }));
  };

  const deleteVoicePrompt = (entryId: string, promptIndex: number) => {
    setScheduleEntries(prev => prev.map(entry => {
      if (entry.id !== entryId || !entry.voicePrompts) return entry;
      const newPrompts = entry.voicePrompts.filter((_, i) => i !== promptIndex);
      return { ...entry, voicePrompts: newPrompts };
    }));
  };

  return (
    <ScheduleContext.Provider value={{ 
      scheduleEntries,
      addScheduleEntry,
      updateScheduleEntry,
      deleteScheduleEntry,
      getEntriesForDate,
      hasEntriesForDate,
      addVoicePrompt,
      updateVoicePrompt,
      deleteVoicePrompt
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