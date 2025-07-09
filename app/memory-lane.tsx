import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { ArrowLeft, Heart, MapPin, Users, Calendar, Chrome as Home, User, Settings, Phone, Mic, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Voice from '@react-native-community/voice';
import AudioWaveform from '../modules/core/components/AudioWaveform';

interface Memory {
  id: string;
  title: string;
  category: 'people' | 'places' | 'pets' | 'life-events';
  date?: string;
  image: string;
  voiceClip?: string;
  description: string;
  narrator: string;
}

const sampleMemories: Memory[] = [
  {
    id: '1',
    title: 'Family Trip to the Lake',
    category: 'places',
    date: 'Summer 1985',
    image: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_lake_trip.mp3',
    description: 'This was the summer we all went to Lake Tahoe together. You loved feeding the ducks with little Sarah.',
    narrator: 'Your daughter Sarah',
  },
  {
    id: '2',
    title: 'Wedding Day with Robert',
    category: 'life-events',
    date: 'June 12, 1962',
    image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_wedding.mp3',
    description: 'The most beautiful day of your life. You looked radiant in your white dress, and Robert couldn\'t stop smiling.',
    narrator: 'Your sister Mary',
  },
  {
    id: '3',
    title: 'Max the Golden Retriever',
    category: 'pets',
    date: '1978-1992',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_max.mp3',
    description: 'Max was your faithful companion for 14 wonderful years. He loved playing fetch in the backyard.',
    narrator: 'Your grandson Leo',
  },
  {
    id: '4',
    title: 'Christmas Morning 1995',
    category: 'life-events',
    date: 'December 25, 1995',
    image: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_christmas.mp3',
    description: 'The kids were so excited to open presents. You made the most delicious Christmas cookies that morning.',
    narrator: 'Your daughter Sarah',
  },
  {
    id: '5',
    title: 'Garden with Your Roses',
    category: 'places',
    date: 'Spring 1988',
    image: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_garden.mp3',
    description: 'You spent countless hours tending to your beautiful rose garden. The red roses were always your favorite.',
    narrator: 'Your neighbor Mrs. Johnson',
  },
  {
    id: '6',
    title: 'Dancing with Robert',
    category: 'people',
    date: '1960s',
    image: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=800',
    voiceClip: 'voice_dancing.mp3',
    description: 'You and Robert loved to dance together. Every Friday night was dance night at the community center.',
    narrator: 'Your friend Betty',
  },
];

const categories = [
  { id: 'all', name: 'All Memories', icon: Heart, color: '#4682B4' },
  { id: 'people', name: 'People', icon: Users, color: '#FF69B4' },
  { id: 'places', name: 'Places', icon: MapPin, color: '#32CD32' },
  { id: 'pets', name: 'Pets', icon: Heart, color: '#FF8C00' },
  { id: 'life-events', name: 'Life Events', icon: Calendar, color: '#9370DB' },
];

export default function MemoryLane() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();
  const [userMemories, setUserMemories] = useState([]);
  const [audioRecordings, setAudioRecordings] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);
  const [audioPlayingId, setAudioPlayingId] = useState(null);
  // Voice search state variables
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  // Animation values for visual feedback
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const voiceCommandExamples = [
    'Show me pictures of my dog',
    'Show family memories',
    'Show lake memories',
    'Show wedding photos',
    'Show memories with Sarah',
    'Show pet memories',
    'Show places',
    'Show life events',
  ];
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  // Platform check for web
  const isWeb = Platform.OS === 'web';
  const [happyModalVisible, setHappyModalVisible] = useState(false);
  const [happyMemoryIndex, setHappyMemoryIndex] = useState(0);
  const [happySuggested, setHappySuggested] = useState(false); // system suggestion banner
  // Simulate voice command recognition (for demo)
  const [voiceCue, setVoiceCue] = useState(false);

  // Pool of all memories
  const allMemories = [...sampleMemories, ...userMemories];
  // Only show memories with a positive description or pet/people/life-events (for demo, use all)
  const happyMemories = allMemories;

  useEffect(() => {
    const loadUserMemories = async () => {
      try {
        const stored = await AsyncStorage.getItem('memories');
        if (stored) setUserMemories(JSON.parse(stored));
      } catch (e) {
        setUserMemories([]);
      }
    };
    const loadAudioRecordings = async () => {
      try {
        const stored = await AsyncStorage.getItem('audioRecordings');
        if (stored) setAudioRecordings(JSON.parse(stored));
      } catch (e) {
        setAudioRecordings([]);
      }
    };
    loadUserMemories();
    loadAudioRecordings();
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(false);
        return;
      }
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, []);

  // Animation effect for recording
  useEffect(() => {
    let pulse, wave, timer;
    if (isRecording) {
      // Pulse animation
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      // Wave animation
      wave = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      wave.start();
      // Duration timer
      setRecordingDuration(0);
      timer = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      setRecordingDuration(0);
    }
    return () => {
      if (pulse) pulse.stop();
      if (wave) wave.stop();
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const playAudio = async (memory) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: memory.audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(memory.id);
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded) {
          setPlaybackProgress(
            status.durationMillis && status.positionMillis
              ? status.positionMillis / status.durationMillis
              : 0
          );
          setAudioDuration(status.durationMillis || 0);
          if (status.didJustFinish) setPlayingId(null);
        }
      });
    } catch (e) {
      setPlayingId(null);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingId(null);
    }
  };

  const playAudioRecording = async (rec) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: rec.uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setAudioPlayingId(rec.id);
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) setAudioPlayingId(null);
      });
    } catch (e) {
      setAudioPlayingId(null);
    }
  };
  const stopAudioRecording = async () => {
    if (sound) {
      await sound.stopAsync();
      setAudioPlayingId(null);
    }
  };

  const filteredMemories = selectedCategory === 'all'
    ? sampleMemories
    : sampleMemories.filter(m => m.category === selectedCategory);

  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);

  // Handler for voice search button
  const handleVoiceSearchPress = async () => {
    // Placeholder: In future, check/request microphone permission here
    setIsVoiceSearching((prev) => !prev);
    // Optionally reset search state if turning off
    if (isVoiceSearching) {
      setVoiceSearchQuery('');
      setSearchResults([]);
      setIsRecording(false);
    }
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Audio recording is not supported on web.');
      return;
    }
    if (isRecording) return;
    if (hasPermission !== true) {
      Alert.alert('Microphone Permission Required', 'Please enable microphone access in your settings to record audio.');
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  // Voice recognition event handlers
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        setVoiceSearchQuery(event.value[0]);
        setIsProcessing(false);
      }
    };
    Voice.onSpeechError = (event) => {
      setIsProcessing(false);
      Alert.alert('Speech Recognition Error', event.error?.message || 'An error occurred during speech recognition.');
    };
    return () => {
      if (Platform.OS !== 'web') {
        Voice.destroy().then(() => Voice.removeAllListeners && Voice.removeAllListeners());
      }
    };
  }, []);

  // Start voice recognition (speech-to-text)
  const startVoiceRecognition = async () => {
    setIsProcessing(true);
    try {
      await Voice.start('en-US');
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to start speech recognition.');
    }
  };

  // Stop voice recognition
  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to stop speech recognition.');
    }
  };

  // Modify stopVoiceRecording to trigger speech-to-text
  const stopVoiceRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      // Start speech-to-text recognition
      await startVoiceRecognition();
      recordingRef.current = null;
    } catch (e) {
      Alert.alert('Error', 'Failed to stop recording.');
      setIsProcessing(false);
    }
  };

  // Add effect to perform search when voiceSearchQuery changes
  useEffect(() => {
    if (voiceSearchQuery && voiceSearchQuery.trim().length > 0) {
      // Basic natural language parsing for common commands
      const query = voiceSearchQuery.toLowerCase();
      let category = null;
      let keyword = '';
      if (query.includes('family')) category = 'people';
      else if (query.includes('pet') || query.includes('dog') || query.includes('cat')) category = 'pets';
      else if (query.includes('place') || query.includes('trip') || query.includes('lake') || query.includes('garden')) category = 'places';
      else if (query.includes('event') || query.includes('wedding') || query.includes('christmas') || query.includes('life')) category = 'life-events';
      // Extract keyword if present
      const match = query.match(/show (me )?(pictures|photos|memories|events)? ?(of|with)? ?(.+)?/);
      if (match && match[4]) keyword = match[4].trim();
      const allMemories = [...sampleMemories, ...userMemories];
      let filtered = allMemories;
      if (category) {
        filtered = filtered.filter(memory => memory.category === category);
      }
      if (keyword && keyword.length > 0) {
        filtered = filtered.filter(memory =>
          (memory.title && memory.title.toLowerCase().includes(keyword)) ||
          (memory.description && memory.description.toLowerCase().includes(keyword)) ||
          (memory.narrator && memory.narrator.toLowerCase().includes(keyword))
        );
      } else if (!category) {
        // Fallback: search all fields
        filtered = allMemories.filter(memory =>
          (memory.title && memory.title.toLowerCase().includes(query)) ||
          (memory.description && memory.description.toLowerCase().includes(query)) ||
          (memory.category && memory.category.toLowerCase().includes(query)) ||
          (memory.narrator && memory.narrator.toLowerCase().includes(query))
        );
      }
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [voiceSearchQuery, userMemories]);

  // Clear search handler
  const clearVoiceSearch = () => {
    setVoiceSearchQuery('');
    setSearchResults([]);
    setIsVoiceSearching(false);
    setIsProcessing(false);
  };

  // Handler for Play a Happy Memory button
  const openHappyMemory = (suggested = false) => {
    if (happyMemories.length === 0) return;
    setHappyMemoryIndex(Math.floor(Math.random() * happyMemories.length));
    setHappyModalVisible(true);
    setHappySuggested(suggested);
  };
  // Handler for Next Memory
  const nextHappyMemory = () => {
    if (happyMemories.length === 0) return;
    setHappyMemoryIndex((prev) => (prev + 1) % happyMemories.length);
    setHappySuggested(false);
  };
  // Simulate voice command cue (for demo)
  const simulateVoiceCue = () => {
    setVoiceCue(true);
    openHappyMemory(true);
    setTimeout(() => setVoiceCue(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}> 
      {calmMode && <View style={styles.calmOverlay} />}
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')} activeOpacity={0.7}>
            <ArrowLeft size={scaleText(24)} color={getCalmModeTextColor()} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Memory Lane</Text>
            <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>Revisit your cherished memories</Text>
          </View>
          {/* Voice Search Button and Help Button */}
          {!isWeb && (
            <>
              <Animated.View style={{
                marginLeft: scaleText(12),
                transform: [{ scale: pulseAnim }],
              }}>
                <TouchableOpacity
                  style={[styles.voiceSearchButton, { backgroundColor: currentTheme.colors.primary }]}
                  onPressIn={startVoiceRecording}
                  onPressOut={stopVoiceRecording}
                  activeOpacity={0.8}
                  accessibilityLabel="Voice Search Memories"
                  accessibilityRole="button"
                  disabled={isProcessing}
                >
                  <Mic size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                  {isRecording && (
                    <Animated.View
                      style={[
                        styles.waveRing,
                        {
                          opacity: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                          transform: [
                            { scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                          ],
                          position: 'absolute',
                          left: -10,
                          top: -10,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
                {isRecording && (
                  <Text style={{ color: currentTheme.colors.primary, fontWeight: '700', marginTop: 2, textAlign: 'center' }}>
                    Recording... {recordingDuration}s
                  </Text>
                )}
                {isProcessing && (
                  <Text style={{ color: currentTheme.colors.primary, fontWeight: '700', marginTop: 2, textAlign: 'center' }}>
                    Processing voice...
                  </Text>
                )}
              </Animated.View>
              {/* Help Button */}
              <TouchableOpacity
                style={[styles.helpButton, { backgroundColor: calmMode ? 'rgba(255,255,255,0.1)' : currentTheme.colors.surface, marginLeft: scaleText(8) }]}
                onPress={() => setShowHelp(true)}
                activeOpacity={0.8}
                accessibilityLabel="Voice Search Help"
                accessibilityRole="button"
              >
                <Info size={scaleText(22)} color={currentTheme.colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}
        </View>
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, isActive && { backgroundColor: cat.color }]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Icon size={scaleText(20)} color={isActive ? '#fff' : cat.color} />
                <Text style={[styles.categoryText, isActive && { color: '#fff' }]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {/* Play a Happy Memory Button */}
      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
        <TouchableOpacity
          style={styles.happyButton}
          onPress={() => openHappyMemory(false)}
          accessibilityLabel="Play a Happy Memory"
          accessibilityRole="button"
        >
          <Heart size={scaleText(28)} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.happyButtonText}>Play a Happy Memory</Text>
        </TouchableOpacity>
        {/* Simulate voice command cue button (for demo/testing) */}
        <TouchableOpacity
          style={styles.simulateVoiceButton}
          onPress={simulateVoiceCue}
          accessibilityLabel="Simulate 'Play a Happy Memory' Voice Command"
          accessibilityRole="button"
        >
          <Mic size={scaleText(20)} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.simulateVoiceText}>Simulate Voice Command</Text>
        </TouchableOpacity>
        {voiceCue && (
          <View style={styles.voiceCueBanner}>
            <Text style={styles.voiceCueText}>Voice command recognized: "Play a happy memory"</Text>
          </View>
        )}
      </View>
      {/* Memories List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* Audio Recordings Section */}
          {audioRecordings.length > 0 && (
            <View style={{ width: '100%', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: getCalmModeTextColor() }}>Your Audio Recordings</Text>
              {audioRecordings.map(rec => (
                <View key={rec.id} style={[styles.memoryCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 16 }]}> 
                  <Text style={[styles.memoryTitle, { color: getCalmModeTextColor() }]}>{rec.title}</Text>
                  <Text style={[styles.memoryDate, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{new Date(rec.timestamp).toLocaleString()}</Text>
                  <TouchableOpacity
                    style={{ marginTop: 10, backgroundColor: audioPlayingId === rec.id ? '#FFD600' : '#eee', borderRadius: 8, padding: 10 }}
                    onPress={() => audioPlayingId === rec.id ? stopAudioRecording() : playAudioRecording(rec)}
                  >
                    <Text style={{ color: '#333', fontWeight: '600' }}>{audioPlayingId === rec.id ? 'Stop' : 'Play'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {/* User Memories */}
          {userMemories.length > 0 && (
            <View style={{ width: '100%', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: getCalmModeTextColor() }}>Your Voice Memories</Text>
              {userMemories.map(memory => (
                <View key={memory.id} style={[styles.memoryCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 16 }]}> 
                  <Text style={[styles.memoryTitle, { color: getCalmModeTextColor() }]}>{memory.title}</Text>
                  <Text style={[styles.memoryDate, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{new Date(memory.timestamp).toLocaleString()}</Text>
                  <TouchableOpacity
                    style={{ marginTop: 10, backgroundColor: playingId === memory.id ? '#FFD600' : '#eee', borderRadius: 8, padding: 10 }}
                    onPress={() => playingId === memory.id ? stopAudio() : playAudio(memory)}
                  >
                    <Text style={{ color: '#333', fontWeight: '600' }}>{playingId === memory.id ? 'Stop' : 'Play'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {/* Voice Search Results */}
          {voiceSearchQuery && (
            <View style={{ width: '100%', marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: currentTheme.colors.primary, marginBottom: 6 }}>
                Results for: "{voiceSearchQuery}"
              </Text>
              <TouchableOpacity onPress={clearVoiceSearch} style={{ marginBottom: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eee', borderRadius: 8 }}>
                <Text style={{ color: '#333', fontWeight: '600' }}>Clear Search</Text>
              </TouchableOpacity>
              {searchResults.length === 0 ? (
                <Text style={{ color: calmMode ? '#A0A0A0' : '#888', fontSize: 16, fontStyle: 'italic', marginTop: 10 }}>
                  No results found.
                </Text>
              ) : (
                searchResults.map(memory => (
                  <View key={memory.id} style={styles.memoryCard}>
                    <Image source={{ uri: memory.image }} style={styles.memoryImage} />
                    <View style={styles.memoryInfo}>
                      <Text style={[styles.memoryTitle, { color: getCalmModeTextColor() }]}>{memory.title}</Text>
                      <Text style={[styles.memoryDate, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{memory.date}</Text>
                      <Text style={[styles.memoryDesc, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]} numberOfLines={2}>
                        {memory.description}
                      </Text>
                      <Text style={[styles.memoryNarrator, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}> {memory.narrator} </Text>
                      {/* Audio Waveform and Controls */}
                      {memory.voiceClip && (!isWeb ? (
                        <View style={{ marginTop: 10, alignItems: 'center', width: '100%' }}>
                          <AudioWaveform
                            isPlaying={playingId === memory.id}
                            progress={playingId === memory.id ? playbackProgress : 0}
                            duration={audioDuration}
                            theme={currentTheme}
                            scaleText={scaleText}
                            calmMode={calmMode}
                          />
                          <TouchableOpacity
                            style={{ marginTop: 4, backgroundColor: playingId === memory.id ? currentTheme.colors.primary : '#eee', borderRadius: 8, padding: 8 }}
                            onPress={() => playingId === memory.id ? stopAudio() : playAudio(memory)}
                          >
                            <Text style={{ color: playingId === memory.id ? '#fff' : '#333', fontWeight: '600' }}>
                              {playingId === memory.id ? 'Pause' : 'Play'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ color: currentTheme.colors.textSecondary, fontSize: scaleText(14), marginTop: 10 }}>
                          Audio waveform and playback are not supported on web.
                        </Text>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          {/* Sample Memories (only show if not searching) */}
          {!voiceSearchQuery && filteredMemories.map(memory => (
            <View key={memory.id} style={styles.memoryCard}>
              <Image source={{ uri: memory.image }} style={styles.memoryImage} />
              <View style={styles.memoryInfo}>
                <Text style={[styles.memoryTitle, { color: getCalmModeTextColor() }]}>{memory.title}</Text>
                <Text style={[styles.memoryDate, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{memory.date}</Text>
                <Text style={[styles.memoryDesc, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]} numberOfLines={2}>
                  {memory.description}
                </Text>
                <Text style={[styles.memoryNarrator, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}> {memory.narrator} </Text>
                {/* Audio Waveform and Controls */}
                {memory.voiceClip && (!isWeb ? (
                  <View style={{ marginTop: 10, alignItems: 'center', width: '100%' }}>
                    <AudioWaveform
                      isPlaying={playingId === memory.id}
                      progress={playingId === memory.id ? playbackProgress : 0}
                      duration={audioDuration}
                      theme={currentTheme}
                      scaleText={scaleText}
                      calmMode={calmMode}
                    />
                    <TouchableOpacity
                      style={{ marginTop: 4, backgroundColor: playingId === memory.id ? currentTheme.colors.primary : '#eee', borderRadius: 8, padding: 8 }}
                      onPress={() => playingId === memory.id ? stopAudio() : playAudio(memory)}
                    >
                      <Text style={{ color: playingId === memory.id ? '#fff' : '#333', fontWeight: '600' }}>
                        {playingId === memory.id ? 'Pause' : 'Play'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ color: currentTheme.colors.textSecondary, fontSize: scaleText(14), marginTop: 10 }}>
                    Audio waveform and playback are not supported on web.
                  </Text>
                ))}
              </View>
            </View>
          ))}
          {filteredMemories.length === 0 && userMemories.length === 0 && audioRecordings.length === 0 && !voiceSearchQuery && (
            <Text style={[styles.noMemoriesText, { color: getCalmModeTextColor() }]}>No memories in this category yet.</Text>
          )}
        </View>
      </ScrollView>
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={[styles.navButton, styles.activeNavButton]} onPress={() => router.push('/')} activeOpacity={0.7}>
          <Home size={scaleText(22)} color={currentTheme.colors.primary} strokeWidth={2} />
          <Text style={[styles.navLabel, { color: currentTheme.colors.primary }]}>My Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/schedule')} activeOpacity={0.7}>
          <Calendar size={scaleText(22)} color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/contacts')} activeOpacity={0.7}>
          <Phone size={scaleText(22)} color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/profile')} activeOpacity={0.7}>
          <User size={scaleText(22)} color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Settings size={scaleText(22)} color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
      {/* Voice Command Help Modal */}
      {!isWeb && showHelp && (
        <View style={styles.helpModalOverlay}>
          <View style={[styles.helpModal, { backgroundColor: calmMode ? 'rgba(30,30,30,0.98)' : '#fff' }]}> 
            <Text style={[styles.helpTitle, { color: calmMode ? '#fff' : currentTheme.colors.primary }]}>Voice Search Examples</Text>
            {voiceCommandExamples.map((ex, i) => (
              <Text key={i} style={[styles.helpExample, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>
                • {ex}
              </Text>
            ))}
            <TouchableOpacity
              style={[styles.helpCloseButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={() => setShowHelp(false)}
              accessibilityLabel="Close Help"
              accessibilityRole="button"
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: scaleText(16) }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Happy Memory Modal */}
      <Modal
        visible={happyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setHappyModalVisible(false)}
        accessible
        accessibilityViewIsModal
      >
        <Pressable style={styles.happyModalOverlay} onPress={() => setHappyModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close happy memory modal">
          <View style={styles.happyModalCard}>
            {happySuggested && (
              <View style={styles.suggestedBanner}>
                <Text style={styles.suggestedBannerText}>Here's a memory about {happyMemories[happyMemoryIndex]?.title?.split(' ')[0] || 'someone special'}!</Text>
              </View>
            )}
            <Image source={{ uri: happyMemories[happyMemoryIndex]?.image }} style={styles.happyImage} accessibilityLabel="Memory photo" />
            <Text style={styles.happyTitle}>{happyMemories[happyMemoryIndex]?.title}</Text>
            <Text style={styles.happyDate}>{happyMemories[happyMemoryIndex]?.date}</Text>
            <Text style={styles.happyDesc}>{happyMemories[happyMemoryIndex]?.description}</Text>
            <Text style={styles.happyNarrator}>{happyMemories[happyMemoryIndex]?.narrator}</Text>
            <TouchableOpacity
              style={styles.nextMemoryButton}
              onPress={nextHappyMemory}
              accessibilityLabel="Next Memory"
              accessibilityRole="button"
            >
              <Text style={styles.nextMemoryText}>Next Memory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeMemoryButton}
              onPress={() => setHappyModalVisible(false)}
              accessibilityLabel="Close Memory"
              accessibilityRole="button"
            >
              <Text style={styles.closeMemoryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme, scaleText, calmMode, currentTextScale) => StyleSheet.create({
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
    paddingTop: scaleText(12),
    paddingBottom: scaleText(8),
    borderBottomWidth: 0.5,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleText(8),
  },
  backButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(35),
  },
  headerSubtitle: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(22),
    marginTop: scaleText(2),
  },
  categoryScroll: {
    marginTop: scaleText(8),
    marginBottom: scaleText(8),
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(8),
    marginRight: scaleText(10),
    backgroundColor: calmMode ? 'rgba(255,255,255,0.05)' : theme.colors.surface,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255,255,255,0.1)' : theme.colors.border,
  },
  categoryText: {
    fontSize: scaleText(15),
    fontWeight: '600',
    marginLeft: scaleText(8),
    color: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleText(120),
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: scaleText(20),
    paddingTop: scaleText(10),
    paddingBottom: scaleText(20),
    alignItems: 'center',
  },
  memoryCard: {
    width: '100%',
    backgroundColor: calmMode ? 'rgba(255,255,255,0.05)' : theme.colors.surface,
    borderRadius: scaleText(18),
    marginBottom: scaleText(18),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255,255,255,0.1)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
  },
  memoryImage: {
    width: scaleText(100),
    height: scaleText(100),
    borderTopLeftRadius: scaleText(18),
    borderBottomLeftRadius: scaleText(18),
    marginRight: scaleText(12),
  },
  memoryInfo: {
    flex: 1,
    padding: scaleText(12),
    justifyContent: 'center',
  },
  memoryTitle: {
    fontSize: scaleText(20),
    fontWeight: '700',
    marginBottom: scaleText(2),
  },
  memoryDate: {
    fontSize: scaleText(14),
    fontWeight: '500',
    marginBottom: scaleText(4),
  },
  memoryDesc: {
    fontSize: scaleText(15),
    fontWeight: '400',
    marginBottom: scaleText(4),
  },
  memoryNarrator: {
    fontSize: scaleText(13),
    fontWeight: '500',
    fontStyle: 'italic',
  },
  noMemoriesText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    marginTop: scaleText(40),
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.9)' : theme.colors.background,
    borderTopWidth: 0.5,
    borderTopColor: calmMode ? '#808080' : theme.colors.border,
    elevation: 8,
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
  voiceSearchButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleText(12),
    position: 'relative',
    overflow: 'visible',
  },
  waveRing: {
    width: scaleText(64),
    height: scaleText(64),
    borderRadius: scaleText(32),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    position: 'absolute',
    left: -scaleText(10),
    top: -scaleText(10),
    zIndex: -1,
  },
  helpButton: {
    width: scaleText(40),
    height: scaleText(40),
    borderRadius: scaleText(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleText(8),
  },
  helpModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  helpModal: {
    width: '85%',
    borderRadius: scaleText(18),
    padding: scaleText(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  helpTitle: {
    fontSize: scaleText(22),
    fontWeight: '700',
    marginBottom: scaleText(16),
    textAlign: 'center',
  },
  helpExample: {
    fontSize: scaleText(16),
    fontWeight: '500',
    marginBottom: scaleText(8),
    textAlign: 'left',
    width: '100%',
  },
  helpCloseButton: {
    marginTop: scaleText(20),
    borderRadius: scaleText(12),
    paddingHorizontal: scaleText(24),
    paddingVertical: scaleText(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  happyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9370DB',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 18,
    marginBottom: 8,
    elevation: 2,
  },
  happyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
  },
  simulateVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
    elevation: 1,
  },
  simulateVoiceText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  voiceCueBanner: {
    backgroundColor: '#FFD600',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 2,
    alignItems: 'center',
  },
  voiceCueText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 16,
  },
  happyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  happyModalCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: 360,
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  happyImage: {
    width: 220,
    height: 160,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: '#eee',
  },
  happyTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  happyDate: {
    fontSize: 18,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  happyDesc: {
    fontSize: 18,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  happyNarrator: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  nextMemoryButton: {
    backgroundColor: '#9370DB',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
    elevation: 2,
  },
  nextMemoryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  closeMemoryButton: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 8,
    alignSelf: 'center',
  },
  closeMemoryText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  suggestedBanner: {
    backgroundColor: '#FFD600',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  suggestedBannerText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 16,
  },
}); 