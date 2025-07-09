import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Animated, Platform, Modal, Image, Pressable } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useVoiceAssistant } from '../../contexts/VoiceAssistantContext';
import { useTheme } from '../../contexts/ThemeContext';
// import AudioWaveform from './AudioWaveform'; // Uncomment if available

const VoiceAssistant: React.FC = () => {
  const {
    isListening,
    isProcessing,
    lastCommand,
    error,
    startListening,
    stopListening,
  } = useVoiceAssistant();
  const { currentTheme, calmMode } = useTheme();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [whoVisible, setWhoVisible] = useState(false);
  const whoTimeout = useRef<NodeJS.Timeout | null>(null);

  // Simulated data for recognized person
  const recognizedPerson = {
    name: 'Sarah',
    relationship: 'your granddaughter',
    image: require('../../../assets/images/icon.png'), // Placeholder
  };

  // Show modal for 5 seconds or until dismissed
  const showWhoModal = () => {
    setWhoVisible(true);
    if (whoTimeout.current) clearTimeout(whoTimeout.current);
    whoTimeout.current = setTimeout(() => setWhoVisible(false), 5000);
  };
  const dismissWhoModal = () => {
    setWhoVisible(false);
    if (whoTimeout.current) clearTimeout(whoTimeout.current);
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isListening ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isListening]);

  React.useEffect(() => {
    return () => {
      if (whoTimeout.current) clearTimeout(whoTimeout.current);
    };
  }, []);

  return (
    <View style={styles.fabContainer} pointerEvents="box-none">
      {/* Who's Here Modal (simulated trigger) */}
      <Modal
        visible={whoVisible}
        animationType="fade"
        transparent
        onRequestClose={dismissWhoModal}
        accessible
        accessibilityViewIsModal
      >
        <Pressable style={styles.whoOverlay} onPress={dismissWhoModal} accessibilityRole="button" accessibilityLabel="Dismiss Who's Here notification">
          <View style={styles.whoCard} accessible accessibilityLabel={`This is ${recognizedPerson.name}, ${recognizedPerson.relationship}`}> 
            <Image source={recognizedPerson.image} style={styles.whoImage} accessibilityIgnoresInvertColors accessibilityLabel="Person's photo" />
            <View style={styles.whoTextContainer}>
              <Text style={styles.whoName}>{recognizedPerson.name}</Text>
              <Text style={styles.whoRelationship}>This is {recognizedPerson.name}, {recognizedPerson.relationship}.</Text>
              <Text style={styles.whoHint}>(Tap anywhere to close)</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
      {/* Simulate recognition trigger button (remove in production) */}
      <TouchableOpacity
        style={styles.simulateButton}
        onPress={showWhoModal}
        accessibilityLabel="Simulate Who's Here recognition"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={styles.simulateButtonText}>Simulate "Who's Here?"</Text>
      </TouchableOpacity>
      {/* Floating Mic Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: isListening ? currentTheme.colors.primary : currentTheme.colors.accent },
          calmMode && { opacity: 0.85 },
        ]}
        onPress={isListening ? stopListening : startListening}
        accessibilityLabel={isListening ? 'Stop voice assistant' : 'Start voice assistant'}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        {isListening ? (
          <Mic color="#fff" size={28} />
        ) : (
          <MicOff color="#fff" size={28} />
        )}
      </TouchableOpacity>

      {/* Listening Visual Feedback */}
      {isListening && (
        <Animated.View style={[styles.listeningOverlay, { opacity: fadeAnim }]}> 
          {/* Uncomment if AudioWaveform is available */}
          {/* <AudioWaveform listening /> */}
          <Text style={styles.listeningText}>Listening...</Text>
        </Animated.View>
      )}

      {/* Command Display & Processing */}
      {(isListening || isProcessing || lastCommand || error) && (
        <View style={styles.statusContainer}>
          {isProcessing && <ActivityIndicator size="small" color={currentTheme.colors.primary} />}
          {lastCommand && !isProcessing && !error && (
            <Text style={styles.commandText}>"{lastCommand}"</Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 32 : 24,
    right: 24,
    zIndex: 9999,
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  listeningOverlay: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  listeningText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  commandText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
    marginVertical: 2,
    textAlign: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  whoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  whoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: 320,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  whoImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  whoTextContainer: {
    alignItems: 'center',
  },
  whoName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  whoRelationship: {
    fontSize: 18,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  whoHint: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  simulateButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#9370DB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10000,
    marginTop: 8,
    marginRight: 8,
    elevation: 2,
  },
  simulateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default VoiceAssistant; 