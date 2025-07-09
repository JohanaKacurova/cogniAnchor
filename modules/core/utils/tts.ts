import * as Speech from 'expo-speech';

export interface TTSSpeakOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export function speak(
  message: string,
  options: TTSSpeakOptions = {}
) {
  if (!message) return;
  Speech.speak(message, {
    language: options.language || 'en-US',
    pitch: options.pitch || 1.0,
    rate: options.rate || 1.0,
    voice: options.voice,
    onDone: options.onDone,
    onError: options.onError,
  });
}

export function stop() {
  Speech.stop();
} 