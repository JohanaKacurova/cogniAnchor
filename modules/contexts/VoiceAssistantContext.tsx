import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Voice from '@react-native-community/voice';
import { speak as ttsSpeak } from '../core/utils/tts';
import { useTheme } from './ThemeContext';
import { processVoiceCommand } from '../core/utils/voiceCommands';
import { Platform } from 'react-native';

interface VoiceAssistantState {
  isListening: boolean;
  isProcessing: boolean;
  lastCommand: string;
  confidence: number;
  error: string | null;
}

interface VoiceAssistantActions {
  startListening: () => void;
  stopListening: () => void;
  processCommand: (command: string) => Promise<void>;
  speak: (text: string) => void;
}

interface VoiceAssistantContextType extends VoiceAssistantState, VoiceAssistantActions {}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

interface VoiceAssistantProviderProps {
  children: ReactNode;
}

export const VoiceAssistantProvider: React.FC<VoiceAssistantProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  // Start listening for voice input
  const startListening = useCallback(() => {
    setError(null);
    if (Platform.OS === 'web') {
      setError('Voice assistant is not supported on web.');
      return;
    }
    setIsListening(true);
    Voice.start('en-US');
  }, []);

  // Stop listening for voice input
  const stopListening = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsListening(false);
      return;
    }
    setIsListening(false);
    Voice.stop();
  }, []);

  // Speak text using TTS
  const speak = useCallback((text: string) => {
    ttsSpeak(text);
  }, []);

  // Process a recognized command (integrated with command processor)
  const processCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    setLastCommand(command);
    setConfidence(1); // Placeholder, real confidence from recognition event
    const { handled, handler } = await processVoiceCommand(command);
    if (handled && handler) {
      speak(`Navigating: ${command}`);
    } else {
      speak("Sorry, I didn't understand that command.");
    }
    setIsProcessing(false);
  }, [speak]);

  // Voice event listeners (setup/cleanup)
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const onSpeechResults = (e: any) => {
      const results = e.value;
      if (results && results[0]) {
        processCommand(results[0]);
      }
    };
    const onSpeechError = (e: any) => {
      setError(e.error?.message || 'Voice recognition error');
      setIsListening(false);
    };
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [processCommand]);

  const value: VoiceAssistantContextType = {
    isListening,
    isProcessing,
    lastCommand,
    confidence,
    error,
    startListening,
    stopListening,
    processCommand,
    speak,
  };

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (context === undefined) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
} 