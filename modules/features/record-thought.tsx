import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import { ArrowLeft, Mic, Play, Pause, Trash2, Save, Share, Volume2, Heart, Check, Chrome as Home, Calendar, User, Settings, Phone, CreditCard as Edit3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export default function RecordThoughtScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [shareWithCaregiver, setShareWithCaregiver] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string>('');
  const [thoughtTitle, setThoughtTitle] = useState<string>('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [memories, setMemories] = useState([]);
  const recordingRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for recording button
  useEffect(() => {
    if (recordingState === 'recording') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Wave animation
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      waveAnimation.start();

      return () => {
        pulseAnimation.stop();
        waveAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [recordingState]);

  // Recording duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Check/request permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Load memories from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const existing = await AsyncStorage.getItem('memories');
        if (existing) {
          setMemories(JSON.parse(existing));
        }
      } catch (e) {
        console.error('[Memory] Failed to load memories', e);
      }
    })();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoBack = () => {
    if (recordingState === 'recording') {
      Alert.alert(
        'Stop Recording?',
        'You are currently recording. Do you want to stop and go back?',
        [
          { text: 'Keep Recording', style: 'cancel' },
          { 
            text: 'Stop & Go Back', 
            style: 'destructive',
            onPress: () => {
              setRecordingState('idle');
              setRecordingDuration(0);
              router.push('/(tabs)/' as any);
            }
          }
        ]
      );
    } else {
      router.push('/(tabs)/' as any);
    }
  };

  const RECORDING_OPTIONS_PRESET_HIGH_QUALITY = {
    android: {
      extension: '.m4a',
      outputFormat: 2, // MPEG_4
      audioEncoder: 3, // AAC
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      audioQuality: 2, // high
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  };

  const startRecording = async () => {
    console.log('[Recording] Start button pressed');
    if (isProcessing) return;
    if (isRecording) {
      console.log('[Recording] Already recording, ignoring start');
      return;
    }
    if (!hasPermission) {
      Alert.alert('Microphone permission is required to record.');
      return;
    }
    setIsProcessing(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setRecordingState('recording');
      setRecordingDuration(0);
      setRecordingUri('');
      setShowTitleInput(false);
      console.log('[Recording] Recording started');
    } catch (err) {
      Alert.alert('Failed to start recording.');
      console.error('[Recording] startRecording error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    console.log('[Recording] Stop button pressed');
    if (isProcessing) return;
    if (!isRecording || !recording) {
      console.log('[Recording] No active recording to stop');
      return;
    }
    setIsProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        Alert.alert('Failed to stop recording: No URI returned.');
        setIsProcessing(false);
        return;
      }
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      setRecordingState('recorded');
      setShowTitleInput(true); // Show naming modal
      console.log('[Recording] Recording stopped, URI:', uri);
    } catch (err) {
      Alert.alert('Failed to stop recording.');
      console.error('[Recording] stopRecording error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordToggle = () => {
    if (Platform.OS === 'web') {
      // Web implementation would use Web Audio API
      Alert.alert('Not supported', 'Audio recording is not supported on web. Please use a mobile device.');
      return;
    }
    if (recordingState === 'idle' || recordingState === 'recorded') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const handlePlayToggle = () => {
    if (recordingState === 'recorded') {
      setRecordingState('playing');
      console.log('Playing recorded thought');
      
      // Simulate playback completion
      setTimeout(() => {
        setRecordingState('recorded');
      }, 3000);
    } else if (recordingState === 'playing') {
      setRecordingState('recorded');
      console.log('Pausing playback');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording?',
      'Are you sure you want to delete this thought recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setRecordingState('idle');
            setRecordingDuration(0);
            setRecordingUri('');
            setThoughtTitle('');
            setShowTitleInput(false);
          }
        }
      ]
    );
  };

  // Save memory to AsyncStorage
  const handleSave = async () => {
    if (!recordingUri) {
      Alert.alert('No Recording', 'Please record a thought first.');
      return;
    }
    try {
      const id = Date.now().toString();
      const timestamp = new Date().toISOString();
      const memory = { id, title: thoughtTitle || 'Untitled Thought', uri: recordingUri, timestamp };
      const updatedMemories = [...memories, memory];
      setMemories(updatedMemories);
      await AsyncStorage.setItem('memories', JSON.stringify(updatedMemories));
      Alert.alert(
        'Your Thought Has Been Saved! 💙',
        shareWithCaregiver 
          ? 'Your thought has been saved and will be shared with your caregiver.'
          : 'Your thought has been saved privately for you.',
        [
          { 
            text: 'Record Another', 
            onPress: () => {
              setRecordingState('idle');
              setRecordingDuration(0);
              setRecordingUri('');
              setThoughtTitle('');
              setShareWithCaregiver(false);
              setShowTitleInput(false);
            }
          },
          { 
            text: 'Go Back', 
            onPress: () => router.push('/(tabs)/' as any)
          }
        ]
      );
    } catch (error) {
      console.error('[Memory] Failed to save memory', error);
      Alert.alert('Failed to save memory.');
    }
  };

  const handleTabPress = (route: string) => {
    if (recordingState === 'recording') {
      Alert.alert(
        'Stop Recording?',
        'You are currently recording. Do you want to stop and navigate away?',
        [
          { text: 'Keep Recording', style: 'cancel' },
          { 
            text: 'Stop & Navigate', 
            style: 'destructive',
            onPress: () => {
              setRecordingState('idle');
              setRecordingDuration(0);
              router.push(route as any);
            }
          }
        ]
      );
    } else {
      router.push(route as any);
    }
  };

  const getMainButtonContent = () => {
    switch (recordingState) {
      case 'idle':
        return {
          icon: <Mic size={scaleText(60)} color="#FFFFFF" strokeWidth={2} />,
          text: 'Tap to Start Recording',
          subtext: 'Share whatever\'s on your mind'
        };
      case 'recording':
        return {
          icon: <Mic size={scaleText(60)} color="#FF4444" strokeWidth={2} />,
          text: 'Recording...',
          subtext: 'Tap to stop'
        };
      case 'recorded':
      case 'playing':
        return {
          icon: <Volume2 size={scaleText(60)} color="#FFFFFF" strokeWidth={2} />,
          text: 'Recording Complete',
          subtext: 'Tap play to listen'
        };
    }
  };

  const mainButton = getMainButtonContent();
  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}>
      {calmMode && <View style={styles.calmOverlay} />}
      
      {/* Sticky Date/Time Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
          </View>
          <Text style={[styles.date, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{formatDate(currentTime)}</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={scaleText(24)} color={getCalmModeTextColor()} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Record a Thought</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Tap the microphone to share whatever's on your mind
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {/* Central Recording Button */}
          <View style={styles.recordingSection}>
            <Animated.View style={[styles.recordingButtonContainer, { transform: [{ scale: pulseAnim }] }]}>  
              {/* Start Recording Button */}
              {(recordingState === 'idle' || recordingState === 'recorded') && (
                <TouchableOpacity
                  style={[
                    styles.recordingButton,
                    isProcessing && { opacity: 0.5 }
                  ]}
                  onPress={startRecording}
                  activeOpacity={0.8}
                  disabled={isProcessing || isRecording}
                >
                  <Mic size={scaleText(40)} color={'#FFFFFF'} strokeWidth={2} />
                  <Text style={{ color: '#fff', fontWeight: '700', marginTop: 8 }}>Start Recording</Text>
                </TouchableOpacity>
              )}
              {/* Stop Recording Button */}
              {recordingState === 'recording' && (
                <TouchableOpacity
                  style={[
                    styles.recordingButton,
                    styles.recordingActive,
                    isProcessing && { opacity: 0.5 }
                  ]}
                  onPress={stopRecording}
                  activeOpacity={0.8}
                  disabled={isProcessing || !isRecording || !recording}
                >
                  <Mic size={scaleText(40)} color={'#FF4444'} strokeWidth={2} />
                  <Text style={{ color: '#FF4444', fontWeight: '700', marginTop: 8 }}>Stop Recording</Text>
                </TouchableOpacity>
              )}
              {/* Wave animation for recording */}
              {recordingState === 'recording' && (
                <>
                  <Animated.View style={[
                    styles.waveRing,
                    {
                      opacity: waveAnim,
                      transform: [{
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3]
                        })
                      }]
                    }
                  ]} />
                  <Animated.View style={[
                    styles.waveRing,
                    styles.waveRing2,
                    {
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.6]
                      }),
                      transform: [{
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.6]
                        })
                      }]
                    }
                  ]} />
                </>
              )}
            </Animated.View>

            <Text style={[styles.recordingText, { color: getCalmModeTextColor() }]}>
              {mainButton.text}
            </Text>
            <Text style={[styles.recordingSubtext, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
              {mainButton.subtext}
            </Text>

            {/* Recording Duration */}
            {(recordingState === 'recording' || recordingState === 'recorded' || recordingState === 'playing') && (
              <View style={styles.durationContainer}>
                <Text style={[styles.durationText, { color: getCalmModeTextColor() }]}>
                  Duration: {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
          </View>

          {/* Thought Title Input */}
          {showTitleInput && (recordingState === 'recorded' || recordingState === 'playing') && (
            <View style={styles.titleSection}>
              <Text style={[styles.titleLabel, { color: getCalmModeTextColor() }]}>
                Give this thought a title (optional)
              </Text>
              <View style={styles.titleInputContainer}>
                <Edit3 size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
                <TextInput
                  style={[
                    styles.titleInput,
                    { 
                      color: getCalmModeTextColor(),
                      backgroundColor: 'transparent'
                    }
                  ]}
                  value={thoughtTitle}
                  onChangeText={setThoughtTitle}
                  placeholder="Give your thought a title (optional)"
                  placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
                  maxLength={60}
                />
              </View>
            </View>
          )}

          {/* Playback Controls */}
          {(recordingState === 'recorded' || recordingState === 'playing') && (
            <View style={styles.playbackSection}>
              <Text style={[styles.playbackTitle, { color: getCalmModeTextColor() }]}>
                Listen to Your Thought
              </Text>
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={[styles.playButton, recordingState === 'playing' && styles.playButtonActive]}
                  onPress={handlePlayToggle}
                  activeOpacity={0.8}
                  disabled={isProcessing || !recording}
                >
                  {recordingState === 'playing' ? (
                    <Pause size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <Play size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.8}
                >
                  <Trash2 size={scaleText(28)} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.playbackSubtext, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                {recordingState === 'playing' ? 'Playing your thought...' : 'Tap play to hear your recording'}
              </Text>
            </View>
          )}

          {/* Sharing Option */}
          {(recordingState === 'recorded' || recordingState === 'playing') && (
            <View style={styles.sharingSection}>
              <TouchableOpacity 
                style={styles.shareToggle}
                onPress={() => setShareWithCaregiver(!shareWithCaregiver)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  shareWithCaregiver && styles.checkboxChecked
                ]}>
                  {shareWithCaregiver && (
                    <Check size={scaleText(16)} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
                <View style={styles.shareTextContainer}>
                  <Text style={[styles.shareText, { color: getCalmModeTextColor() }]}>
                    Share this with my caregiver
                  </Text>
                  <Text style={[styles.shareSubtext, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                    They'll be able to listen to this thought
                  </Text>
                </View>
                <Share size={scaleText(24)} color={shareWithCaregiver ? currentTheme.colors.primary : (calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary)} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          {/* Save Button */}
          {(recordingState === 'recorded' || recordingState === 'playing') && (
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Save size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Save Thought</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.push('/(tabs)/' as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Comfort Message */}
          <View style={styles.comfortSection}>
            <Heart size={scaleText(24)} color={calmMode ? '#FF8FA3' : '#FF69B4'} strokeWidth={2} />
            <Text style={[styles.comfortText, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>
              Your thoughts are important and valued. Take your time.
            </Text>
          </View>

          {/* Activity Indicator for async feedback */}
          {isProcessing && (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#0000ff" />
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => handleTabPress('/(tabs)/')}
          activeOpacity={0.7}
        >
          <Home 
            size={scaleText(22)} 
            color={currentTheme.colors.primary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: currentTheme.colors.primary }]}>
            My Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/(tabs)/schedule')}
          activeOpacity={0.7}
        >
          <Calendar 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Schedule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/(tabs)/contacts')}
          activeOpacity={0.7}
        >
          <Phone 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Contacts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <User 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Settings 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  theme: any,
  scaleText: (size: number) => number,
  calmMode: boolean,
  currentTextScale: any
) => StyleSheet.create<{
  container: ViewStyle;
  calmOverlay: ViewStyle;
  stickyHeader: ViewStyle;
  dateTimeContainer: ViewStyle;
  timeWrapper: ViewStyle;
  time: TextStyle;
  date: TextStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerContent: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  mainContent: ViewStyle;
  recordingSection: ViewStyle;
  recordingButtonContainer: ViewStyle;
  recordingButton: ViewStyle;
  recordingActive: ViewStyle;
  recordingComplete: ViewStyle;
  waveRing: ViewStyle;
  waveRing2: ViewStyle;
  recordingText: TextStyle;
  recordingSubtext: TextStyle;
  durationContainer: ViewStyle;
  durationText: TextStyle;
  titleSection: ViewStyle;
  titleLabel: TextStyle;
  titleInputContainer: ViewStyle;
  titleInput: TextStyle;
  playbackSection: ViewStyle;
  playbackTitle: TextStyle;
  playbackControls: ViewStyle;
  playButton: ViewStyle;
  playButtonActive: ViewStyle;
  deleteButton: ViewStyle;
  playbackSubtext: TextStyle;
  sharingSection: ViewStyle;
  shareToggle: ViewStyle;
  checkbox: ViewStyle;
  checkboxChecked: ViewStyle;
  shareTextContainer: ViewStyle;
  shareText: TextStyle;
  shareSubtext: TextStyle;
  actionSection: ViewStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  comfortSection: ViewStyle;
  comfortText: TextStyle;
  bottomNavigation: ViewStyle;
  navButton: ViewStyle;
  activeNavButton: ViewStyle;
  navLabel: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  calmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  stickyHeader: {
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.background,
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(12),
    borderBottomWidth: 0.5,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
    minHeight: scaleText(70),
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: scaleText(8),
  },
  timeWrapper: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.accent,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    minWidth: scaleText(80),
  },
  time: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  date: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: scaleText(16),
    flexShrink: 1,
  },
  header: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: currentTextScale.id === 'extra-large' ? 'stretch' : 'center',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.surface,
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(16),
    borderBottomWidth: 1,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(80),
    gap: currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  backButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    alignSelf: currentTextScale.id === 'extra-large' ? 'flex-start' : 'auto',
  },
  headerContent: {
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
    justifyContent: 'center',
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  headerTitle: {
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(35),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
    marginTop: scaleText(4),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    maxWidth: currentTextScale.id === 'extra-large' ? '90%' : '100%',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleText(120), // Extra padding for bottom navigation
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: scaleText(20),
    paddingTop: scaleText(30),
    paddingBottom: scaleText(20),
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: scaleText(30),
    width: '100%',
  },
  recordingButtonContainer: {
    position: 'relative',
    marginBottom: scaleText(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    width: currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
    height: currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
    borderRadius: currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(90),
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: calmMode ? 0.15 : 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  recordingActive: {
    backgroundColor: '#FFE4E1',
    borderColor: '#FF4444',
  },
  recordingComplete: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  waveRing: {
    position: 'absolute',
    width: currentTextScale.id === 'extra-large' ? scaleText(240) : scaleText(220),
    height: currentTextScale.id === 'extra-large' ? scaleText(240) : scaleText(220),
    borderRadius: currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(110),
    borderWidth: 2,
    borderColor: '#87CEEB',
    backgroundColor: 'transparent',
  },
  waveRing2: {
    width: currentTextScale.id === 'extra-large' ? scaleText(280) : scaleText(260),
    height: currentTextScale.id === 'extra-large' ? scaleText(280) : scaleText(260),
    borderRadius: currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(130),
    borderWidth: 1,
  },
  recordingText: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(8),
    lineHeight: scaleText(30),
    maxWidth: '90%',
  },
  recordingSubtext: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: scaleText(24),
    maxWidth: '85%',
  },
  durationContainer: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(12),
    marginTop: scaleText(20),
    borderWidth: 2,
    borderColor: theme.colors.accent,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minWidth: scaleText(150),
  },
  durationText: {
    fontSize: scaleText(20),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: scaleText(26),
  },
  titleSection: {
    marginBottom: scaleText(25),
    alignItems: 'center',
    width: '100%',
  },
  titleLabel: {
    fontSize: scaleText(20),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(15),
    lineHeight: scaleText(26),
    maxWidth: '90%',
  },
  titleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(16),
    gap: scaleText(12),
    minHeight: scaleText(60),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    maxWidth: scaleText(350),
  },
  titleInput: {
    flex: 1,
    fontSize: scaleText(18),
    fontWeight: '500',
    lineHeight: scaleText(24),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  playbackSection: {
    alignItems: 'center',
    marginBottom: scaleText(25),
    width: '100%',
  },
  playbackTitle: {
    fontSize: scaleText(22),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(20),
    lineHeight: scaleText(28),
    maxWidth: '90%',
  },
  playbackControls: {
    flexDirection: 'row',
    gap: scaleText(20),
    alignItems: 'center',
    marginBottom: scaleText(12),
    justifyContent: 'center',
  },
  playButton: {
    width: scaleText(80),
    height: scaleText(80),
    borderRadius: scaleText(40),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonActive: {
    backgroundColor: '#FF8C00',
  },
  deleteButton: {
    width: scaleText(70),
    height: scaleText(70),
    borderRadius: scaleText(35),
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playbackSubtext: {
    fontSize: scaleText(16),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: scaleText(22),
    maxWidth: '85%',
  },
  sharingSection: {
    marginBottom: scaleText(25),
    alignItems: 'center',
    width: '100%',
  },
  shareToggle: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(20),
    gap: scaleText(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    width: '100%',
    maxWidth: scaleText(400),
  },
  checkbox: {
    width: scaleText(24),
    height: scaleText(24),
    borderRadius: scaleText(6),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  shareTextContainer: {
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  shareText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: scaleText(24),
    marginBottom: scaleText(4),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  shareSubtext: {
    fontSize: scaleText(16),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    lineHeight: scaleText(22),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: scaleText(20),
    gap: scaleText(16),
    width: '100%',
  },
  saveButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(32),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(80),
    width: '100%',
    maxWidth: scaleText(300),
  },
  saveButtonText: {
    fontSize: scaleText(22),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(28),
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(16),
    paddingHorizontal: scaleText(24),
    minHeight: scaleText(60),
    width: '100%',
    maxWidth: scaleText(250),
  },
  cancelButtonText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  comfortSection: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1',
    borderRadius: scaleText(16),
    padding: scaleText(20),
    gap: scaleText(12),
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : '#FFB3BA',
    width: '100%',
    maxWidth: scaleText(400),
  },
  comfortText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(22),
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.9)' : theme.colors.background,
    borderTopWidth: 0.5,
    borderTopColor: calmMode ? '#808080' : theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: calmMode ? 0.3 : 0.1,
    shadowRadius: 4,
    height: Math.max(85, scaleText(85)),
    paddingBottom: scaleText(15),
    paddingTop: scaleText(8),
    opacity: calmMode ? 0.95 : 1,
    zIndex: 1000,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(8),
    borderRadius: calmMode ? scaleText(12) : 0,
    marginHorizontal: calmMode ? scaleText(4) : 0,
    marginVertical: calmMode ? scaleText(4) : 0,
  },
  activeNavButton: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : undefined,
  },
  navLabel: {
    fontSize: scaleText(12),
    fontWeight: '600',
    marginTop: scaleText(4),
    lineHeight: scaleText(16),
    textAlign: 'center',
  },
});

export function PressHoldAudioRecorder() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [recordingName, setRecordingName] = useState('');
  const [memories, setMemories] = useState([]);
  const recordingRef = useRef(null);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Microphone permission is required to record.');
      }
    })();
    // Load memories
    (async () => {
      try {
        const existing = await AsyncStorage.getItem('memories');
        if (existing) setMemories(JSON.parse(existing));
      } catch (e) {
        console.error('[Memory] Failed to load memories', e);
      }
    })();
  }, []);

  // Start recording
  const handleStartRecording = async () => {
    if (isProcessing || isRecording) return;
    if (!hasPermission) {
      Alert.alert('Microphone permission is required to record.');
      return;
    }
    setIsProcessing(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 2,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      await rec.startAsync();
      setRecording(rec);
      recordingRef.current = rec;
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Failed to start recording.');
      console.error('[Recording] startRecording error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (isProcessing || !isRecording || !recordingRef.current) return;
    setIsProcessing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setRecording(null);
      recordingRef.current = null;
      setIsRecording(false);
      setModalVisible(true);
    } catch (err) {
      Alert.alert('Failed to stop recording.');
      console.error('[Recording] stopRecording error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save memory
  const handleSave = async () => {
    if (!recordingUri || !recordingName.trim()) {
      Alert.alert('Please enter a name for your recording.');
      return;
    }
    try {
      const id = Date.now().toString();
      const timestamp = new Date().toISOString();
      const memory = { id, title: recordingName.trim(), uri: recordingUri, timestamp };
      const updatedMemories = [...memories, memory];
      setMemories(updatedMemories);
      await AsyncStorage.setItem('memories', JSON.stringify(updatedMemories));
      setModalVisible(false);
      setRecordingName('');
      setRecordingUri('');
      Alert.alert('Recording saved!');
    } catch (err) {
      Alert.alert('Failed to save recording.');
      console.error('[Memory] Failed to save memory', err);
    }
  };

  // Cancel modal
  const handleCancel = () => {
    setModalVisible(false);
    setRecordingName('');
    setRecordingUri('');
  };

  return (
    <View style={pressHoldStyles.container}>
      <Pressable
        style={({ pressed }) => [
          pressHoldStyles.button,
          isRecording ? pressHoldStyles.buttonRecording : pressHoldStyles.buttonIdle,
          (isProcessing || !hasPermission) && pressHoldStyles.buttonDisabled,
          pressed && !isProcessing && hasPermission && !isRecording && pressHoldStyles.buttonPressed,
        ]}
        onPressIn={handleStartRecording}
        onPressOut={handleStopRecording}
        disabled={isProcessing || !hasPermission}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={pressHoldStyles.buttonText}>
            {isRecording ? 'Recording…' : 'Hold to Record'}
          </Text>
        )}
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCancel}
      >
        <View style={pressHoldStyles.modalOverlay}>
          <View style={pressHoldStyles.modalContainer}>
            <Text style={pressHoldStyles.modalTitle}>Name your recording</Text>
            <TextInput
              style={pressHoldStyles.textInput}
              placeholder="Enter name"
              value={recordingName}
              onChangeText={setRecordingName}
              autoFocus
            />
            <View style={pressHoldStyles.modalButtons}>
              <Pressable style={pressHoldStyles.saveButton} onPress={handleSave}>
                <Text style={pressHoldStyles.saveButtonText}>Save</Text>
              </Pressable>
              <Pressable style={pressHoldStyles.cancelButton} onPress={handleCancel}>
                <Text style={pressHoldStyles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pressHoldStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  button: {
    width: 220,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    elevation: 3,
  },
  buttonIdle: {
    backgroundColor: '#3498db',
  },
  buttonRecording: {
    backgroundColor: '#e74c3c',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    width: 300,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});