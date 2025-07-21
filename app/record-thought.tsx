import React, { useReducer, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';
import { ProgressBar } from 'react-native-paper';
import { Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Add Sentry import if available (optional, safe to ignore if not configured)
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
} catch {}

const initialState = {
  status: 'idle', // idle | recording | recorded | playing | processing | error
  error: null,
  duration: 0,
  isModalVisible: false,
  recordingName: '',
  recordingUri: null,
  playbackPosition: 0,
  playbackMillis: 0,
  durationMillis: 1,
  soundObject: null,
  drafts: [],
  encrypted: null,
  uploadProgress: 0,
  showErrorModal: false,
  recentlyDeleted: [],
  showUndoSnackbar: false,
  lastDeleted: null,
};

function recorderReducer(state, action) {
  switch (action.type) {
    case 'START_RECORDING':
      return { ...state, status: 'recording', error: null, duration: 0 };
    case 'STOP_RECORDING':
      return { ...state, status: 'recorded', error: null, isModalVisible: true, recordingUri: action.uri };
    case 'PROCESSING':
      return { ...state, status: 'processing', error: null };
    case 'IDLE':
      return { ...state, status: 'idle', error: null, duration: 0 };
    case 'PLAY':
      return { ...state, status: 'playing', error: null };
    case 'PAUSE':
      return { ...state, status: 'recorded', error: null };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error, showErrorModal: true };
    case 'SET_MODAL_VISIBLE':
      return { ...state, isModalVisible: action.value };
    case 'SET_RECORDING_NAME':
      return { ...state, recordingName: action.value };
    case 'SET_PLAYBACK':
      return { ...state, playbackPosition: action.position, playbackMillis: action.millis, durationMillis: action.duration };
    case 'SET_SOUND_OBJECT':
      return { ...state, soundObject: action.value };
    case 'RESET_PLAYBACK':
      return { ...state, playbackPosition: 0, playbackMillis: 0, durationMillis: 1, soundObject: null };
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.value };
    case 'DELETE_RECORDING':
      return {
        ...state,
        recentlyDeleted: [...state.recentlyDeleted, { ...action.recording, deletedAt: Date.now() }],
        showUndoSnackbar: true,
        lastDeleted: action.recording,
      };
    case 'UNDO_DELETE':
      return {
        ...state,
        recentlyDeleted: state.recentlyDeleted.filter(r => r.id !== action.recording.id),
        showUndoSnackbar: false,
        lastDeleted: null,
      };
    case 'HIDE_SNACKBAR':
      return { ...state, showUndoSnackbar: false, lastDeleted: null };
    case 'RESET_ALL':
      return { ...initialState, drafts: state.drafts };
    case 'CLOSE_ERROR_MODAL':
      return { ...state, showErrorModal: false, error: null };
    default:
      return state;
  }
}

const ENCRYPTION_KEY = 'my-very-strong-static-key-please-change'; // For demo only. Use secure key management in production.

async function encryptBase64(base64: string): Promise<string> {
  return CryptoJS.AES.encrypt(base64, ENCRYPTION_KEY).toString();
}

async function decryptBase64(ciphertext: string): Promise<string> {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export default function RecordThoughtScreen() {
  const { currentTheme, scaleText } = useTheme();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [state, dispatch] = useReducer(recorderReducer, initialState);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordTimer, setRecordTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showRecordedMsg, setShowRecordedMsg] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSharedMsg, setShowSharedMsg] = useState(false);

  // For top bar time/date
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // For navigation
  const router = useRouter();

  // Request and cache permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(false);
        Alert.alert('Not supported', 'Audio recording is not supported on web.');
      return;
    }
      try {
      const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      if (status !== 'granted') {
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access in your settings to record audio.'
          );
        }
      } catch (e) {
        setHasPermission(false);
        Alert.alert('Error', 'Could not request microphone permission.');
        console.error('Permission error:', e);
      }
    })();
  }, []);

  // Timer logic
  useEffect(() => {
    if (state.status === 'recording') {
      setRecordTimer(0);
      const interval = setInterval(() => setRecordTimer(t => t + 1), 1000);
      setTimerInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
    }
    return () => { if (timerInterval) clearInterval(timerInterval); setTimerInterval(null); };
  }, [state.status]);

  // Start recording
  const handleStartRecording = async () => {
    if (state.status === 'processing' || state.status === 'recording' || hasPermission !== true) return;
    dispatch({ type: 'PROCESSING' });
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable microphone access in settings',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        dispatch({ type: 'IDLE' });
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      dispatch({ type: 'START_RECORDING' });
    } catch (e) {
      console.error('Recording error:', e);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      dispatch({ type: 'IDLE' });
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (state.status === 'processing' || state.status !== 'recording') return;
    dispatch({ type: 'PROCESSING' });
    try {
      const rec = recordingRef.current;
      if (!rec) throw new Error('No active recording');
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error('No URI from recording');
      dispatch({ type: 'STOP_RECORDING', uri });
      recordingRef.current = null;
    } catch (e) {
      handleError('Could not stop recording.', e);
      console.error('Stop recording error:', e);
    }
  };

  // Simulate upload with progress (replace with real upload logic as needed)
  const simulateUpload = async (onProgress: (progress: number) => void) => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        onProgress(Math.min(progress, 1));
        if (progress >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  // Save recording to AsyncStorage (encrypt base64, show progress)
  const handleSaveRecording = async () => {
    if (!state.recordingUri) return;
    dispatch({ type: 'PROCESSING' });
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(state.recordingUri, { encoding: FileSystem.EncodingType.Base64 });
      // Encrypt base64
      const encrypted = await encryptBase64(base64);
      // Simulate upload with progress
      await simulateUpload((progress) => dispatch({ type: 'SET_UPLOAD_PROGRESS', value: progress }));
      const newRecording = {
        id: `${Date.now()}`,
        title: state.recordingName || 'Untitled Recording',
        encrypted, // store encrypted base64
        timestamp: new Date().toISOString(),
      };
      const existing = await AsyncStorage.getItem('audioRecordings');
      const recordings = existing ? JSON.parse(existing) : [];
      recordings.push(newRecording);
      try {
        await AsyncStorage.setItem('audioRecordings', JSON.stringify(recordings));
      } catch (error) {
        console.error('Storage error:', error);
    Alert.alert(
          'Storage Full',
          'Save to cloud instead?',
      [
            { text: 'iCloud', onPress: () => {/* uploadToCloud(newRecording) */} },
        { text: 'Cancel', style: 'cancel' },
          ]
        );
        dispatch({ type: 'IDLE' });
      return;
    }
      dispatch({ type: 'RESET_ALL' });
      Alert.alert('Saved!', 'Your recording has been saved.');
    } catch (e) {
      handleError('Failed to save recording.', e);
      console.error('Save error:', e);
    }
  };

  // Cancel and discard recording
  const handleCancel = async () => {
    dispatch({ type: 'RESET_ALL' });
    if (state.soundObject) {
      await state.soundObject.unloadAsync();
      dispatch({ type: 'SET_SOUND_OBJECT', value: null });
    }
  };

  // Audio playback logic (decrypt and play)
  const playRecording = async () => {
    if (!state.recordingUri && !state.encrypted) return;
    try {
      if (state.soundObject) {
        await state.soundObject.unloadAsync();
        dispatch({ type: 'SET_SOUND_OBJECT', value: null });
      }
      let base64 = '';
      if (state.recordingUri) {
        // For just-recorded (not yet encrypted)
        base64 = await FileSystem.readAsStringAsync(state.recordingUri, { encoding: FileSystem.EncodingType.Base64 });
      } else if (state.encrypted) {
        // For saved (encrypted) recording
        base64 = await decryptBase64(state.encrypted);
      }
      // Write to temp file
      const tempUri = FileSystem.cacheDirectory + 'temp_recording.m4a';
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            dispatch({
              type: 'SET_PLAYBACK',
              position: status.durationMillis
                ? (status.positionMillis || 0) / status.durationMillis
                : 0,
              millis: status.positionMillis || 0,
              duration: status.durationMillis || 1,
            });
            if (status.didJustFinish) {
              dispatch({ type: 'PAUSE' });
              dispatch({ type: 'SET_PLAYBACK', position: 1, millis: status.durationMillis || 0, duration: status.durationMillis || 1 });
            }
    } else {
            handleError('Playback failed: Could not play the recording.', null);
            dispatch({ type: 'PAUSE' });
          }
        }
      );
      dispatch({ type: 'SET_SOUND_OBJECT', value: sound });
      dispatch({ type: 'PLAY' });
    } catch (err) {
      handleError('Playback failed: Could not play the recording.', err);
      dispatch({ type: 'PAUSE' });
    }
  };

  const pauseRecording = async () => {
    if (state.soundObject) {
      await state.soundObject.pauseAsync();
      dispatch({ type: 'PAUSE' });
    }
  };

  // One-tap record/stop logic
  const handleRecordButton = async () => {
    if (state.status === 'idle' || state.status === 'recorded' || state.status === 'error') {
      setShowRecordedMsg(false);
      setShowShare(false);
      setShowSharedMsg(false);
      await handleStartRecording();
    } else if (state.status === 'recording') {
      await handleStopRecording();
      setShowRecordedMsg(true);
      setShowShare(true);
    }
  };

  // Share button logic (placeholder)
  const handleShare = () => {
    setShowSharedMsg(true);
    setTimeout(() => setShowSharedMsg(false), 2000);
  };

  // Button UI state
  const buttonDisabled = state.status === 'processing' || hasPermission !== true;
  const buttonText = state.status === 'recording' ? 'Recording…' : 'Tap & Hold to Speak';

  // Retry logic: restart recording
  const retryRecording = async () => {
    dispatch({ type: 'CLOSE_ERROR_MODAL' });
    await handleStartRecording();
  };

  // Delete failed recording (reset all state)
  const deleteFailedRecording = async () => {
    dispatch({ type: 'RESET_ALL' });
  };

  // Save as draft (for demo, just close error modal and keep data in drafts)
  const saveDraft = async () => {
    // For demo, just add to drafts array
    if (state.recordingName || state.recordingUri) {
      state.drafts.push({
        title: state.recordingName || 'Untitled Draft',
        uri: state.recordingUri,
        timestamp: new Date().toISOString(),
      });
    }
    dispatch({ type: 'CLOSE_ERROR_MODAL' });
  };

  // Handle delete (simulate deleting the just-recorded audio)
  const handleDelete = () => {
    if (state.recordingUri || state.encrypted) {
      const deleted = {
        id: state.id || `${Date.now()}`,
        title: state.recordingName || 'Untitled Recording',
        encrypted: state.encrypted,
        uri: state.recordingUri,
      timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'DELETE_RECORDING', recording: deleted });
      dispatch({ type: 'RESET_ALL' });
      // Remove from AsyncStorage if needed (for demo, not shown here)
      // Start timer to auto-remove after 30s
      setTimeout(() => {
        dispatch({ type: 'HIDE_SNACKBAR' });
      }, 30000);
    }
  };

  // Undo delete
  const handleUndo = async () => {
    if (state.lastDeleted) {
      // Restore to AsyncStorage if needed (for demo, not shown here)
      dispatch({ type: 'UNDO_DELETE', recording: state.lastDeleted });
      // Optionally restore to UI state
      // For demo, just show as a draft
      state.drafts.push({
        title: state.lastDeleted.title,
        uri: state.lastDeleted.uri,
        timestamp: state.lastDeleted.timestamp,
      });
    }
  };

  // Replace all Alert.alert('Error', ...) with:
  function handleError(errorMsg: string, errorObj?: any) {
    if (Sentry && Sentry.captureException) {
      Sentry.captureException(errorObj || new Error(errorMsg));
    }
    dispatch({ type: 'ERROR', error: errorMsg });
  }

  React.useEffect(() => {
    console.log("TEST - Component mounted");
    return () => console.log("TEST - Component unmounted");
  }, []);

  // Dynamic styles for top/bottom bars
  const themedStyles = createThemedStyles(currentTheme, scaleText);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme?.colors?.background || '#fff' }]}> 
      {/* Top Bar with Time and Date */}
      <View style={themedStyles.stickyHeader}>
        <View style={themedStyles.dateTimeContainer}>
          <View style={themedStyles.timeWrapper}>
            <Text style={themedStyles.time}>{formatTime(currentTime)}</Text>
          </View>
          <Text style={themedStyles.date}>{formatDate(currentTime)}</Text>
        </View>
      </View>
      {/* Main Content */}
      <View style={styles.centered}>
        {/* Instructions above the button */}
        <Text style={styles.instructions}>Tap to record your thought</Text>
        {/* One-tap Record/Stop Button */}
        <Pressable
          onPress={handleRecordButton}
          disabled={state.status === 'processing' || hasPermission !== true}
          style={({ pressed }) => [
            styles.oneTapButton,
            state.status === 'recording' && styles.oneTapButtonRecording,
            pressed && styles.oneTapButtonPressed,
            (state.status === 'processing' || hasPermission !== true) && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={state.status === 'recording' ? 'Stop recording' : 'Start recording'}
        >
          {state.status === 'recording' ? (
            <MaterialIcons name="stop" size={64} color="#fff" />
          ) : (
            <MaterialIcons name="keyboard-voice" size={64} color="#fff" />
          )}
        </Pressable>
        {/* Timer or confirmation */}
        {state.status === 'recording' && (
          <Text style={styles.timerText}>{recordTimer}s</Text>
        )}
        {showRecordedMsg && (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationText}>Your thought has been recorded!</Text>
          </View>
        )}
        {/* Share with Caregiver */}
        {showShare && (
          <Pressable
            style={styles.shareButton}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share with Caregiver"
          >
            <MaterialIcons name="share" size={32} color="#fff" />
            <Text style={styles.shareButtonText}>Share with Caregiver</Text>
          </Pressable>
        )}
        {/* Shared confirmation */}
        {showSharedMsg && (
          <View style={styles.sharedBox}>
            <Text style={styles.sharedText}>Shared!</Text>
          </View>
        )}
        {/* Drafts/Preview Section */}
        <View style={styles.draftsSection}>
          <Text style={styles.draftEmpty}>Saved thoughts will appear here</Text>
        </View>
        {state.status === 'processing' && (
          <ActivityIndicator size="large" color="#FF4444" style={{ marginTop: 24 }} />
        )}
      </View>
      {/* Bottom Navigation Bar */}
      <View style={themedStyles.bottomNav}>
        <Pressable style={themedStyles.navButton} onPress={() => router.push('/')}> 
          <Feather name="home" size={scaleText(24)} color={currentTheme?.colors?.primary || '#2196F3'} />
          <Text style={themedStyles.navLabel}>My Day</Text>
        </Pressable>
        <Pressable style={themedStyles.navButton} onPress={() => router.push('/schedule')}>
          <Feather name="calendar" size={scaleText(24)} color={currentTheme?.colors?.primary || '#2196F3'} />
          <Text style={themedStyles.navLabel}>Schedule</Text>
        </Pressable>
        <Pressable style={themedStyles.navButton} onPress={() => router.push('/contacts')}>
          <Feather name="users" size={scaleText(24)} color={currentTheme?.colors?.primary || '#2196F3'} />
          <Text style={themedStyles.navLabel}>Contacts</Text>
        </Pressable>
        <Pressable style={themedStyles.navButton} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={scaleText(24)} color={currentTheme?.colors?.primary || '#2196F3'} />
          <Text style={themedStyles.navLabel}>Settings</Text>
        </Pressable>
        <Pressable style={themedStyles.navButton} onPress={() => router.push('/profile')}>
          <Feather name="user" size={scaleText(24)} color={currentTheme?.colors?.primary || '#2196F3'} />
          <Text style={themedStyles.navLabel}>Profile</Text>
        </Pressable>
      </View>
      {/* Modals and Snackbar remain unchanged */}
      <Modal
        visible={state.isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name your recording</Text>
            <TextInput
              value={state.recordingName}
              onChangeText={v => dispatch({ type: 'SET_RECORDING_NAME', value: v })}
              placeholder="Enter a name…"
              style={styles.input}
              autoFocus
              maxLength={50}
            />
            {/* Playback controls for the just-recorded audio */}
            {state.recordingUri && (
              <View style={styles.playbackSection}>
                <Pressable
                  style={styles.playPauseBtn}
                  onPress={state.status === 'playing' ? pauseRecording : playRecording}
                >
                  <Feather
                    name={state.status === 'playing' ? 'pause' : 'play'}
                    size={scaleText(28)}
                    color="#2196F3"
                  />
                </Pressable>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round(state.playbackPosition * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.floor(state.playbackMillis / 1000)}s / {Math.floor(state.durationMillis / 1000)}s
                </Text>
              </View>
            )}
            {state.status === 'processing' && (
              <ProgressBar
                progress={state.uploadProgress}
                color={currentTheme.colors.primary}
                style={{ width: '100%', marginBottom: 16, height: 8, borderRadius: 4 }}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={handleDelete}>
                <Text style={styles.cancelText}>Delete</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveRecording}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={state.showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => dispatch({ type: 'CLOSE_ERROR_MODAL' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}> 
            <Text style={[styles.modalTitle, { color: '#FF4444' }]}>Error</Text>
            <Text style={{ color: '#333', marginBottom: 16, textAlign: 'center' }}>{state.error}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={styles.saveBtn} onPress={retryRecording}>
                <Text style={styles.saveText}>Retry</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={deleteFailedRecording}>
                <Text style={styles.cancelText}>Delete</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveDraft}>
                <Text style={styles.saveText}>Save Draft</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Snackbar
        visible={state.showUndoSnackbar}
        onDismiss={() => dispatch({ type: 'HIDE_SNACKBAR' })}
        duration={30000}
        action={{ label: 'Undo', onPress: handleUndo }}
        style={{ backgroundColor: '#333' }}
      >
        Recording deleted. Undo?
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appName: {
    fontSize: 24, // 1.5rem ~ 24px
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  micButtonWrapper: {
    marginBottom: 18,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    color: 'white',
    transitionProperty: 'all',
    transitionDuration: '100ms',
  },
  micButtonRecording: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    animationName: 'pulse',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    boxShadow: '0 0 0 0 rgba(76,175,80,0.7)',
  },
  micButtonPressed: {
    backgroundColor: '#3E8E41',
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  instructions: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  draftsSection: {
    width: '90%',
    marginTop: 18,
    alignItems: 'center',
  },
  draftsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    color: '#2196F3',
  },
  draftEmpty: {
    color: '#aaa',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    padding: 10,
  },
  saveBtn: {
    padding: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '700',
  },
  playbackSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  playPauseBtn: {
    backgroundColor: '#e3f0fa',
    borderRadius: 24,
    padding: 8,
    marginBottom: 8,
  },
  progressBarBg: {
    width: '80%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,0,0,0.3)',
    zIndex: 9999,
  },
  testRecorderButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
  },
  testRecorderRecording: {
    backgroundColor: '#FF4444',
  },
  testRecorderPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  testRecorderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  oneTapButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  oneTapButtonRecording: {
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
  },
  oneTapButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4444',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationBox: {
    backgroundColor: '#e3f0fa',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 22,
    color: '#2196F3',
    fontWeight: '700',
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9370DB',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginTop: 24,
    alignSelf: 'center',
    elevation: 2,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
    marginLeft: 12,
  },
  sharedBox: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    alignItems: 'center',
  },
  sharedText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
}); 

// Add this function for dynamic themed styles
function createThemedStyles(theme, scaleText) {
  return StyleSheet.create({
    stickyHeader: {
      backgroundColor: theme?.colors?.background || '#f7f7f7',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme?.colors?.border || '#eee',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      zIndex: 1000,
      minHeight: 70,
    },
    dateTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeWrapper: {
      backgroundColor: theme?.colors?.surface || '#fff',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme?.colors?.accent || '#eee',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
      minWidth: 80,
    },
    time: {
      fontSize: 18,
      fontWeight: '600',
      color: theme?.colors?.text || '#333',
      textAlign: 'center',
    },
    date: {
      fontSize: 16,
      fontWeight: '500',
      color: theme?.colors?.primary || '#2196F3',
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
      flexShrink: 1,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: theme?.colors?.background || '#fff',
      borderTopWidth: 1,
      borderTopColor: theme?.colors?.border || '#eee',
      zIndex: 10,
    },
    navButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    navLabel: {
      fontSize: 12,
      color: theme?.colors?.primary || '#2196F3',
      marginTop: 2,
      fontWeight: '500',
    },
  });
} 