import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { VoiceAssistantProvider } from '@/contexts/VoiceAssistantContext';
import VoiceAssistant from '@/core/components/VoiceAssistant';
import { PatientProvider } from '../modules/contexts/PatientContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ContactsProvider>
        <ScheduleProvider>
          <VoiceAssistantProvider>
            <PatientProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="contacts" options={{ headerShown: false }} />
                <Stack.Screen name="schedule" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="add-contact" options={{ headerShown: false }} />
                <Stack.Screen name="edit-schedule" options={{ headerShown: false }} />
                <Stack.Screen name="memory-lane" options={{ headerShown: false }} />
                <Stack.Screen name="record-thought" options={{ headerShown: false }} />
                <Stack.Screen name="calm-zone" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <VoiceAssistant />
              <StatusBar style="auto" />
            </PatientProvider>
          </VoiceAssistantProvider>
        </ScheduleProvider>
      </ContactsProvider>
    </ThemeProvider>
  );
} 