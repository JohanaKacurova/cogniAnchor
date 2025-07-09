import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { ArrowLeft, Play, Heart, MapPin, Users, Calendar, Shuffle, Volume2, X, Pause, Plus, Chrome as Home, User, Settings, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import memoryCategories from '../../config/memory-categories.json';

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

const categories = memoryCategories;

const ICONS: Record<string, any> = { Heart, Users, MapPin, Calendar };

const renderCategoryIcon = (cat: any) => {
  if (ICONS[cat.icon]) {
    return ICONS[cat.icon]({ size: 20, color: cat.color });
  }
  if (typeof cat.icon === 'string') {
    return <Text style={{ fontSize: 20 }}>{cat.icon}</Text>;
  }
  return <Text style={{ fontSize: 20 }}>❓</Text>;
};

type TabRoute = '/' | '/schedule' | '/contacts' | '/profile' | '/settings';

export default function MemoryLaneScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;
  const [audioMemories, setAudioMemories] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const soundRef = React.useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load user-saved audio memories on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('memories');
        if (stored) setAudioMemories(JSON.parse(stored));
      } catch (e) {
        console.error('[MemoryLane] Failed to load audio memories', e);
      }
    })();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
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

  const handleGoBack = () => {
    router.back();
  };

  const handleTabPress = (route: TabRoute) => {
    router.push(route);
  };

  const filteredMemories = selectedCategory === 'all' 
    ? sampleMemories 
    : sampleMemories.filter(memory => memory.category === selectedCategory);

  const handleMemoryPress = (memory: Memory) => {
    setSelectedMemory(memory);
    setIsPlaying(false);
  };

  const handleCloseModal = () => {
    setSelectedMemory(null);
    setIsPlaying(false);
  };

  const handlePlayVoice = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would play/pause the actual voice clip
    console.log(`${isPlaying ? 'Pausing' : 'Playing'} voice clip: ${selectedMemory?.voiceClip}`);
  };

  const handlePlayRandomMemory = () => {
    const randomMemory = sampleMemories[Math.floor(Math.random() * sampleMemories.length)];
    setSelectedMemory(randomMemory);
    setIsPlaying(true);
    console.log('Playing random happy memory:', randomMemory.title);
  };

  const handleAddMemory = () => {
    router.push('/add-memory' as any);
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : currentTheme.colors.primary;
  };

  // Play or pause audio memory
  const handlePlayAudioMemory = async (memory) => {
    try {
      if (playingId === memory.id) {
        // Pause if already playing
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
          setPlayingId(null);
        }
        return;
      }
      setIsAudioLoading(true);
      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: memory.uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(memory.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
        }
      });
    } catch (e) {
      Alert.alert('Playback error', 'Could not play this recording.');
      setPlayingId(null);
      console.error('[MemoryLane] Playback error', e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale, width, height, isSmallScreen, isLargeScreen);

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
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Memory Lane</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Cherished moments from your life
          </Text>
        </View>

        {/* Add Memory Button */}
        <TouchableOpacity 
          style={styles.addMemoryButton}
          onPress={handleAddMemory}
          activeOpacity={0.8}
        >
          <Plus size={scaleText(20)} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addMemoryText}>Add Memory</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Audio Memories Section */}
        {audioMemories.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={[styles.sectionTitle, { color: getCalmModeTextColor(), marginBottom: 12 }]}>Your Voice Memories</Text>
            {audioMemories.map((memory) => (
              <View key={memory.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#f7f7fa', borderRadius: 12, padding: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: getCalmModeTextColor() }}>{memory.title}</Text>
                  <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{new Date(memory.timestamp).toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                  style={{ marginLeft: 12, backgroundColor: playingId === memory.id ? '#e74c3c' : '#3498db', borderRadius: 20, padding: 8 }}
                  onPress={() => handlePlayAudioMemory(memory)}
                  disabled={isAudioLoading}
                  activeOpacity={0.8}
                >
                  {playingId === memory.id ? (
                    <Pause size={24} color="#fff" />
                  ) : (
                    <Play size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Play Random Memory Button */}
        <TouchableOpacity 
          style={[styles.randomMemoryButton, { backgroundColor: '#FF69B4' }]}
          onPress={handlePlayRandomMemory}
          activeOpacity={0.8}
        >
          <View style={styles.randomButtonContent}>
            <Shuffle size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
            <View style={styles.randomButtonText}>
              <Text style={styles.randomButtonTitle}>Play a Happy Memory</Text>
              <Text style={styles.randomButtonSubtitle}>Let us surprise you with something wonderful</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Category Filter Tabs */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>Browse Your Memories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    isSelected && styles.categoryTabActive,
                    { borderColor: category.color }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.8}
                >
                  {renderCategoryIcon(category)}
                  <Text style={[
                    styles.categoryTabText,
                    { color: isSelected ? '#FFFFFF' : (calmMode ? '#C0C0C0' : category.color) }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Memory Cards Grid */}
        <View style={styles.memoriesGrid}>
          {filteredMemories.map((memory) => (
            <TouchableOpacity
              key={memory.id}
              style={styles.memoryCard}
              onPress={() => handleMemoryPress(memory)}
              activeOpacity={0.8}
            >
              <View style={styles.memoryImageContainer}>
                <Image source={{ uri: memory.image }} style={styles.memoryImage} />
                <View style={styles.memoryOverlay}>
                  <Play size={scaleText(40)} color="#FFFFFF" strokeWidth={2} />
                </View>
                {memory.date && (
                  <View style={styles.memoryDateBadge}>
                    <Text style={styles.memoryDateText}>{memory.date}</Text>
                  </View>
                )}
              </View>
              <View style={styles.memoryContent}>
                <Text style={[styles.memoryTitle, { color: getCalmModeTextColor() }]}>
                  {memory.title}
                </Text>
                <View style={styles.memoryMeta}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(memory.category) }]} />
                  <Text style={[styles.memoryNarrator, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                    Shared by {memory.narrator}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/')}
          activeOpacity={0.7}
        >
          <Home 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            My Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/schedule')}
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
          onPress={() => handleTabPress('/contacts')}
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
          onPress={() => handleTabPress('/profile')}
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
          onPress={() => handleTabPress('/settings')}
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

      {/* Memory Modal */}
      <Modal
        visible={selectedMemory !== null}
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={handleCloseModal}
      >
        {selectedMemory && (
          <View style={styles.modalContainer}>
            <View style={styles.modalOverlay} />
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <X size={scaleText(28)} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Memory Content */}
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedMemory.image }} style={styles.modalImage} />
              
              <View style={styles.modalInfo}>
                <Text style={styles.modalTitle}>{selectedMemory.title}</Text>
                {selectedMemory.date && (
                  <Text style={styles.modalDate}>{selectedMemory.date}</Text>
                )}
                
                <Text style={styles.modalDescription}>{selectedMemory.description}</Text>
                
                <Text style={styles.modalNarrator}>— {selectedMemory.narrator}</Text>
                
                {/* Voice Controls */}
                {selectedMemory.voiceClip && (
                  <TouchableOpacity 
                    style={styles.voiceButton}
                    onPress={handlePlayVoice}
                    activeOpacity={0.8}
                  >
                    {isPlaying ? (
                      <Pause size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                    ) : (
                      <Volume2 size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                    )}
                    <Text style={styles.voiceButtonText}>
                      {isPlaying ? 'Pause Voice Message' : 'Play Voice Message'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean, currentTextScale: any, width: number, height: number, isSmallScreen: boolean, isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
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
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
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
    minHeight: isSmallScreen ? scaleText(60) : scaleText(70),
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
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: isSmallScreen ? 'stretch' : currentTextScale.id === 'extra-large' ? 'stretch' : 'center',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.surface,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
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
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(160) : scaleText(80),
    gap: isSmallScreen ? scaleText(8) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
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
    textAlign: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
    marginTop: scaleText(4),
    textAlign: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  addMemoryButton: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'row' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9370DB',
    borderRadius: scaleText(16),
    paddingHorizontal: isSmallScreen ? scaleText(8) : scaleText(16),
    paddingVertical: isSmallScreen ? scaleText(8) : scaleText(12),
    gap: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minHeight: scaleText(50),
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'auto',
    minWidth: currentTextScale.id === 'extra-large' ? scaleText(160) : 'auto',
  },
  addMemoryText: {
    fontSize: scaleText(16),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(20),
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingTop: scaleText(20),
    paddingBottom: scaleText(120), // Extra padding for bottom navigation
  },
  randomMemoryButton: {
    backgroundColor: '#FF69B4',
    borderRadius: scaleText(24),
    padding: isSmallScreen ? scaleText(12) : scaleText(24),
    marginBottom: scaleText(30),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: calmMode ? 0.1 : 0.2,
    shadowRadius: 12,
    elevation: 8,
    minHeight: isSmallScreen ? scaleText(80) : scaleText(120),
  },
  randomButtonContent: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
    justifyContent: 'center',
    gap: scaleText(20),
  },
  randomButtonText: {
    flex: isSmallScreen ? 0 : currentTextScale.id === 'extra-large' ? 0 : 1,
    alignItems: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  randomButtonTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(30),
    marginBottom: scaleText(6),
    textAlign: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  randomButtonSubtitle: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: scaleText(22),
    textAlign: isSmallScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  categorySection: {
    marginBottom: scaleText(30),
  },
  sectionTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scaleText(20),
    lineHeight: scaleText(30),
    textAlign: isSmallScreen ? 'left' : 'center',
  },
  categoryScrollContent: {
    paddingHorizontal: isSmallScreen ? 2 : scaleText(4),
    gap: scaleText(12),
  },
  categoryTab: {
    flexDirection: isSmallScreen ? 'row' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderWidth: 2,
    borderRadius: scaleText(20),
    paddingHorizontal: isSmallScreen ? scaleText(10) : scaleText(20),
    paddingVertical: isSmallScreen ? scaleText(8) : scaleText(16),
    gap: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    minWidth: isSmallScreen ? scaleText(80) : currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(140),
    minHeight: isSmallScreen ? scaleText(40) : currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(60),
  },
  categoryTabActive: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryTabText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    lineHeight: scaleText(20),
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isSmallScreen ? scaleText(8) : scaleText(16),
  },
  memoryCard: {
    width: isSmallScreen ? '100%' : currentTextScale.id === 'extra-large' ? '100%' : '48%',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.08 : 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    marginBottom: scaleText(16),
  },
  memoryImageContainer: {
    position: 'relative',
    height: isSmallScreen ? scaleText(100) : scaleText(160),
  },
  memoryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  memoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryDateBadge: {
    position: 'absolute',
    top: isSmallScreen ? scaleText(4) : scaleText(12),
    right: isSmallScreen ? scaleText(4) : scaleText(12),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scaleText(12),
    paddingHorizontal: scaleText(12),
    paddingVertical: scaleText(6),
  },
  memoryDateText: {
    fontSize: scaleText(12),
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: scaleText(16),
  },
  memoryContent: {
    padding: isSmallScreen ? scaleText(8) : scaleText(16),
  },
  memoryTitle: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(24),
    marginBottom: scaleText(8),
    flexWrap: 'wrap',
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? scaleText(4) : scaleText(8),
  },
  categoryDot: {
    width: scaleText(8),
    height: scaleText(8),
    borderRadius: scaleText(4),
    backgroundColor: theme.colors.primary,
  },
  memoryNarrator: {
    fontSize: scaleText(14),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    lineHeight: scaleText(18),
    flex: 1,
    flexWrap: 'wrap',
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
  navLabel: {
    fontSize: scaleText(12),
    fontWeight: '600',
    marginTop: scaleText(4),
    lineHeight: scaleText(16),
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: scaleText(60),
    right: scaleText(20),
    width: scaleText(50),
    height: scaleText(50),
    borderRadius: scaleText(25),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  modalContent: {
    width: '90%',
    maxWidth: scaleText(500),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleText(24),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalImage: {
    width: '100%',
    height: scaleText(300),
    backgroundColor: theme.colors.border,
  },
  modalInfo: {
    padding: scaleText(24),
  },
  modalTitle: {
    fontSize: scaleText(26),
    fontWeight: '700',
    color: '#2C3E50',
    lineHeight: scaleText(32),
    marginBottom: scaleText(8),
    textAlign: 'center',
  },
  modalDate: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: '#4682B4',
    lineHeight: scaleText(22),
    marginBottom: scaleText(20),
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: scaleText(18),
    fontWeight: '400',
    color: '#2C3E50',
    lineHeight: scaleText(26),
    marginBottom: scaleText(16),
    textAlign: 'center',
  },
  modalNarrator: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: scaleText(22),
    marginBottom: scaleText(24),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    borderRadius: scaleText(20),
    paddingVertical: scaleText(16),
    paddingHorizontal: scaleText(24),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceButtonText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(24),
  },
});