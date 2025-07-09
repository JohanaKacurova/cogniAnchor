import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Waves,
  Music,
  MessageCircle,
  Palette,
  Sparkles,
  RotateCcw,
  Chrome as Home,
  Calendar,
  User,
  Settings,
  Phone,
  TreePine,
  CloudRain,
  Sun,
  Wind,
  Bird,
  Flower2,
  Brain
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Video } from 'expo-av';

interface AudioTrack {
  id: string;
  title: string;
  category: 'nature' | 'music' | 'messages';
  duration: string;
  icon: React.ReactNode;
  description: string;
}

interface VisualActivity {
  id: string;
  title: string;
  type: 'animation' | 'drawing' | 'patterns' | 'game';
  icon: React.ReactNode;
  description: string;
  image?: string;
}

const comfortTips = [
  "Take three slow, deep breaths",
  "Look at a photo of a happy memory",
  "Think of someone who loves you",
  "Feel your feet on the ground",
  "Notice five things you can see around you",
  "Remember a peaceful place you've been",
  "Imagine a warm, gentle hug",
  "Listen to the sounds around you",
  "Think of your favorite color",
  "Remember a time you felt safe and loved"
];

type TabRoute = '/' | '/schedule' | '/contacts' | '/profile' | '/settings';

export default function CalmZoneScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [breatheAnim] = useState(new Animated.Value(1));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTip, setCurrentTip] = useState(comfortTips[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [selectedCategory, setSelectedCategory] = useState<'nature' | 'music' | 'messages' | null>(null);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;
  const [showOceanVideo, setShowOceanVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>(null);

  const audioTracks: AudioTrack[] = [
    // Nature Sounds
    {
      id: 'ocean-waves',
      title: 'Gentle Ocean Waves',
      category: 'nature',
      duration: '10:00',
      icon: <Waves size={scaleText(24)} color="#4682B4" strokeWidth={2} />,
      description: 'Peaceful waves lapping on the shore'
    },
    {
      id: 'forest-birds',
      title: 'Forest Birds',
      category: 'nature',
      duration: '15:00',
      icon: <Bird size={scaleText(24)} color="#228B22" strokeWidth={2} />,
      description: 'Gentle bird songs in a quiet forest'
    },
    {
      id: 'rain-sounds',
      title: 'Soft Rain',
      category: 'nature',
      duration: '20:00',
      icon: <CloudRain size={scaleText(24)} color="#87CEEB" strokeWidth={2} />,
      description: 'Light rain on leaves and windows'
    },
    {
      id: 'wind-chimes',
      title: 'Wind Chimes',
      category: 'nature',
      duration: '12:00',
      icon: <Wind size={scaleText(24)} color="#DDA0DD" strokeWidth={2} />,
      description: 'Gentle chimes in a soft breeze'
    },
    // Soft Music
    {
      id: 'piano-lullaby',
      title: 'Piano Lullaby',
      category: 'music',
      duration: '8:00',
      icon: <Music size={scaleText(24)} color="#9370DB" strokeWidth={2} />,
      description: 'Soft piano melodies for relaxation'
    },
    {
      id: 'classical-strings',
      title: 'Classical Strings',
      category: 'music',
      duration: '12:00',
      icon: <Music size={scaleText(24)} color="#DA70D6" strokeWidth={2} />,
      description: 'Gentle string quartet music'
    },
    {
      id: 'meditation-bells',
      title: 'Meditation Bells',
      category: 'music',
      duration: '15:00',
      icon: <Music size={scaleText(24)} color="#20B2AA" strokeWidth={2} />,
      description: 'Peaceful meditation bells'
    },
    // Messages from Loved Ones
    {
      id: 'sarah-message',
      title: 'Message from Sarah',
      category: 'messages',
      duration: '2:30',
      icon: <MessageCircle size={scaleText(24)} color="#FF69B4" strokeWidth={2} />,
      description: 'A loving message from your daughter'
    },
    {
      id: 'leo-message',
      title: 'Message from Leo',
      category: 'messages',
      duration: '1:45',
      icon: <MessageCircle size={scaleText(24)} color="#32CD32" strokeWidth={2} />,
      description: 'Sweet words from your grandson'
    },
    {
      id: 'family-message',
      title: 'Family Message',
      category: 'messages',
      duration: '3:00',
      icon: <MessageCircle size={scaleText(24)} color="#FF8C00" strokeWidth={2} />,
      description: 'Loving words from your whole family'
    }
  ];

  const visualActivities: VisualActivity[] = [
    {
      id: 'ocean-animation',
      title: 'Ocean Waves',
      type: 'animation',
      icon: <Waves size={scaleText(32)} color="#4682B4" strokeWidth={2} />,
      description: 'Watch gentle waves roll in and out',
      image: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: 'clouds-animation',
      title: 'Floating Clouds',
      type: 'animation',
      icon: <Sun size={scaleText(32)} color="#87CEEB" strokeWidth={2} />,
      description: 'Peaceful clouds drifting across the sky',
      image: 'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: 'garden-animation',
      title: 'Flower Garden',
      type: 'animation',
      icon: <Flower2 size={scaleText(32)} color="#FF69B4" strokeWidth={2} />,
      description: 'Beautiful flowers swaying in the breeze',
      image: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: 'simple-drawing',
      title: 'Color Gentle Shapes',
      type: 'drawing',
      icon: <Palette size={scaleText(32)} color="#9370DB" strokeWidth={2} />,
      description: 'Tap to add soft colors to peaceful shapes'
    },
    {
      id: 'calm-patterns',
      title: 'Watch Calm Patterns',
      type: 'patterns',
      icon: <Sparkles size={scaleText(32)} color="#20B2AA" strokeWidth={2} />,
      description: 'Slow, soothing visual patterns for relaxation'
    },
    {
      id: 'mind-match-game',
      title: 'Play a Gentle Memory Game',
      type: 'game',
      icon: <Brain size={scaleText(32)} color="#9370DB" strokeWidth={2} />,
      description: 'Exercise your memory with friendly cards'
    },
    {
      id: 'shape-matching-puzzle',
      title: 'Shape Matching Puzzle',
      type: 'game',
      icon: <Brain size={scaleText(32)} color="#4682B4" strokeWidth={2} />,
      description: 'Drag and match shapes to their outlines',
    },
    {
      id: 'pattern-completion-puzzle',
      title: 'Pattern Completion Puzzle',
      type: 'patterns',
      icon: <Sparkles size={scaleText(32)} color="#FFD700" strokeWidth={2} />,
      description: 'Complete soothing patterns with gentle shapes',
    },
    {
      id: 'color-sorting-puzzle',
      title: 'Color Sorting Puzzle',
      type: 'game',
      icon: <Palette size={scaleText(32)} color="#FF69B4" strokeWidth={2} />,
      description: 'Sort shapes by color in a gentle gradient',
    },
    {
      id: 'size-sequencing-puzzle',
      title: 'Size Sequencing Puzzle',
      type: 'game',
      icon: <Brain size={scaleText(32)} color="#98FB98" strokeWidth={2} />,
      description: 'Arrange shapes from smallest to largest',
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Gentle breathing animation
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Change comfort tip every 30 seconds
    const tipTimer = setInterval(() => {
      const randomTip = comfortTips[Math.floor(Math.random() * comfortTips.length)];
      setCurrentTip(randomTip);
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
      breatheAnimation.stop();
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
    if (isPlaying) {
      Alert.alert(
        'Stop Audio?',
        'You have audio playing. Do you want to stop it and go back?',
        [
          { text: 'Keep Playing', style: 'cancel' },
          { 
            text: 'Stop & Go Back', 
            onPress: () => {
              setIsPlaying(false);
              setCurrentTrack(null);
              router.push('/');
            }
          }
        ]
      );
    } else {
      router.push('/');
    }
  };

  const handleTabPress = (route: TabRoute) => {
    router.push(route);
  };

  const handleCategorySelect = (category: 'nature' | 'music' | 'messages') => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleTrackPlay = (track: AudioTrack) => {
    if (track.id === 'ocean-waves') {
      setShowOceanVideo(true);
      return;
    }
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      console.log('Pausing audio:', track.title);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      console.log('Playing audio:', track.title);
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentTrack(null);
      }, 10000);
    }
  };

  const handleVisualActivity = (activity: VisualActivity) => {
    console.log('Starting visual activity:', activity.title);
    if (activity.type === 'game' && activity.id === 'mind-match-game') {
      router.push('/mind-match' as any);
    } else if (activity.type === 'patterns' && activity.id === 'calm-patterns') {
      router.push('/calm-patterns' as any);
    } else if (activity.id === 'shape-matching-puzzle') {
      router.push('/shape-puzzle' as any);
    } else if (activity.id === 'pattern-completion-puzzle') {
      router.push('/puzzle-patterns' as any);
    } else if (activity.id === 'color-sorting-puzzle') {
      router.push('/puzzle-colors' as any);
    } else if (activity.id === 'size-sequencing-puzzle') {
      router.push('/puzzle-sizes' as any);
    } else if (activity.type === 'animation') {
      Alert.alert(
        activity.title,
        'This would show a peaceful animation. For now, enjoy looking at this calming image.',
        [{ text: 'OK' }]
      );
    } else if (activity.type === 'drawing') {
      Alert.alert(
        'Simple Drawing',
        'This would open a gentle drawing tool with soft colors and simple shapes.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNewTip = () => {
    const randomTip = comfortTips[Math.floor(Math.random() * comfortTips.length)];
    setCurrentTip(randomTip);
  };

  const filteredTracks = selectedCategory 
    ? audioTracks.filter(track => track.category === selectedCategory)
    : [];

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
          <Text style={[styles.date, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.primary }]}>{formatDate(currentTime)}</Text>
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
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Calm Zone</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.primary }]}>
            Choose something peaceful to help you feel calm and centered
          </Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Breathing Circle */}
        <Animated.View style={[
          styles.breathingSection,
          { transform: [{ scale: breatheAnim }] }
        ]}>
          <View style={styles.breathingCircle}>
            <Heart size={scaleText(40)} color="#FF69B4" strokeWidth={2} />
          </View>
          <Text style={[styles.breathingText, { color: getCalmModeTextColor() }]}>
            Breathe with the gentle rhythm
          </Text>
        </Animated.View>

        {/* Audio Section */}
        <View style={styles.audioSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>
            🎶 Listen to Something Soothing
          </Text>
          
          {/* Category Buttons */}
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'nature' && styles.categoryButtonActive
              ]}
              onPress={() => handleCategorySelect('nature')}
              activeOpacity={0.8}
            >
              <TreePine size={scaleText(28)} color={selectedCategory === 'nature' ? '#FFFFFF' : '#228B22'} strokeWidth={2} />
              <Text style={[
                styles.categoryButtonText,
                { color: selectedCategory === 'nature' ? '#FFFFFF' : (calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.text) }
              ]}>
                Nature Sounds
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'music' && styles.categoryButtonActive
              ]}
              onPress={() => handleCategorySelect('music')}
              activeOpacity={0.8}
            >
              <Music size={scaleText(28)} color={selectedCategory === 'music' ? '#FFFFFF' : '#9370DB'} strokeWidth={2} />
              <Text style={[
                styles.categoryButtonText,
                { color: selectedCategory === 'music' ? '#FFFFFF' : (calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.text) }
              ]}>
                Soft Music
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'messages' && styles.categoryButtonActive
              ]}
              onPress={() => handleCategorySelect('messages')}
              activeOpacity={0.8}
            >
              <MessageCircle size={scaleText(28)} color={selectedCategory === 'messages' ? '#FFFFFF' : '#FF69B4'} strokeWidth={2} />
              <Text style={[
                styles.categoryButtonText,
                { color: selectedCategory === 'messages' ? '#FFFFFF' : (calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.text) }
              ]}>
                Messages from Loved Ones
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Tracks */}
          {selectedCategory && (
            <View style={styles.tracksContainer}>
              {filteredTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.trackCard,
                    currentTrack?.id === track.id && isPlaying && styles.trackCardActive
                  ]}
                  onPress={() => handleTrackPlay(track)}
                  activeOpacity={0.8}
                >
                  <View style={styles.trackIcon}>
                    {track.icon}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: getCalmModeTextColor() }]}>
                      {track.title}
                    </Text>
                    <Text style={[styles.trackDescription, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>
                      {track.description}
                    </Text>
                    <Text style={[styles.trackDuration, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.primary }]}>
                      {track.duration}
                    </Text>
                  </View>
                  <View style={styles.trackControls}>
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
                    ) : (
                      <Play size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Volume Control */}
          {isPlaying && (
            <View style={styles.volumeControl}>
              <VolumeX size={scaleText(20)} color={calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary} strokeWidth={2} />
              <View style={styles.volumeSlider}>
                <View style={[styles.volumeTrack, { backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border }]} />
                <View style={[
                  styles.volumeFill, 
                  { 
                    width: `${volume * 100}%`,
                    backgroundColor: currentTheme.colors.primary 
                  }
                ]} />
              </View>
              <Volume2 size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
            </View>
          )}
        </View>

        {/* Visual Activities Section */}
        <View style={styles.visualSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>
            🎨 Watch or Try Something Gentle
          </Text>
          
          <View style={styles.activitiesGrid}>
            {/* Link to Puzzle Level Selection */}
            <TouchableOpacity
              style={[styles.activityCard, styles.specialActivityCard]}
              onPress={() => router.push('/puzzle-levels' as any)}
              activeOpacity={0.85}
              accessibilityLabel="Explore all puzzles"
              accessibilityRole="button"
            >
              <View style={styles.activityIcon}>
                <Brain size={scaleText(32)} color="#4682B4" strokeWidth={2} />
              </View>
              <Text style={styles.activityTitle}>🧩 Explore All Puzzles</Text>
              <Text style={styles.activityDescription}>Try all our gentle, interactive puzzles</Text>
            </TouchableOpacity>
            {/* Existing activities */}
            {visualActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityCard,
                  (activity.type === 'game' || activity.type === 'patterns') && styles.specialActivityCard
                ]}
                onPress={() => handleVisualActivity(activity)}
                activeOpacity={0.8}
              >
                {activity.image && (
                  <Image source={{ uri: activity.image }} style={styles.activityImage} />
                )}
                <View style={[
                  styles.activityOverlay,
                  (activity.type === 'game' || activity.type === 'patterns') && styles.specialActivityOverlay
                ]}>
                  <View style={styles.activityIcon}>
                    {activity.icon}
                  </View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comfort Tip */}
        <View style={styles.comfortTipSection}>
          <View style={styles.comfortTipCard}>
            <View style={styles.comfortTipHeader}>
              <Heart size={scaleText(24)} color="#FF69B4" strokeWidth={2} />
              <Text style={[styles.comfortTipTitle, { color: getCalmModeTextColor() }]}>
                Gentle Reminder
              </Text>
              <TouchableOpacity
                style={styles.refreshTipButton}
                onPress={handleNewTip}
                activeOpacity={0.7}
              >
                <RotateCcw size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.comfortTipText, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>
              {currentTip}
            </Text>
          </View>
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

      {/* Ocean Waves Video Modal */}
      {showOceanVideo && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {React.createElement(Video as any, {
            source: { uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
            rate: 1.0,
            volume: 1.0,
            isMuted: false,
            resizeMode: 'contain',
            shouldPlay: true,
            isLooping: true,
            useNativeControls: true,
            style: { width: Math.min(width * 0.95, 600), height: Math.min(height * 0.5, 340), backgroundColor: '#000' },
            onPlaybackStatusUpdate: (status: any) => setVideoStatus(status),
          })}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 40,
              right: 30,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 24,
              padding: 8,
              zIndex: 10000,
            }}
            onPress={() => setShowOceanVideo(false)}
            accessibilityLabel="Close video"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 22 }}>✕</Text>
          </TouchableOpacity>
          {videoStatus && videoStatus.isBuffering && (
            <ActivityIndicator size="large" color={currentTheme.colors.primary} style={{ position: 'absolute', alignSelf: 'center', top: '50%' }} />
          )}
        </View>
      )}
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
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(80),
    gap: isSmallScreen ? scaleText(8) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
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
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(80),
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
    fontSize: scaleText(32),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(40),
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
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingTop: scaleText(20),
    paddingBottom: scaleText(120), // Extra padding for bottom navigation
  },
  breathingSection: {
    alignItems: 'center',
    marginBottom: scaleText(40),
    paddingVertical: scaleText(20),
  },
  breathingCircle: {
    width: scaleText(120),
    height: scaleText(120),
    borderRadius: scaleText(60),
    backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleText(16),
    borderWidth: 3,
    borderColor: calmMode ? 'rgba(255, 105, 180, 0.5)' : '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.1 : 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  breathingText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: scaleText(24),
    maxWidth: '80%',
  },
  audioSection: {
    marginBottom: scaleText(40),
  },
  sectionTitle: {
    fontSize: scaleText(26),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(24),
    lineHeight: scaleText(32),
  },
  categoryButtons: {
    flexDirection: isSmallScreen ? 'row' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    flexWrap: isSmallScreen ? 'wrap' : currentTextScale.id === 'extra-large' ? 'nowrap' : 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleText(12),
    marginBottom: scaleText(24),
  },
  categoryButton: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
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
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    minHeight: isSmallScreen ? scaleText(60) : scaleText(80),
    minWidth: isSmallScreen ? scaleText(80) : currentTextScale.id === 'extra-large' ? '85%' : scaleText(140),
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryButtonText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: scaleText(20),
    flexWrap: 'wrap',
    maxWidth: scaleText(120),
  },
  tracksContainer: {
    gap: isSmallScreen ? scaleText(6) : scaleText(12),
  },
  trackCard: {
    flexDirection: isSmallScreen ? 'row' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(16),
    padding: isSmallScreen ? scaleText(8) : scaleText(16),
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
    minHeight: isSmallScreen ? scaleText(50) : scaleText(80),
    gap: isSmallScreen ? scaleText(4) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  trackCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: calmMode ? 'rgba(70, 130, 180, 0.2)' : '#F0F8FF',
  },
  trackIcon: {
    width: scaleText(50),
    height: scaleText(50),
    borderRadius: scaleText(25),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    flexShrink: 0,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
    paddingRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(10),
  },
  trackTitle: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(4),
    lineHeight: scaleText(24),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  trackDescription: {
    fontSize: scaleText(14),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    marginBottom: scaleText(4),
    lineHeight: scaleText(18),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  trackDuration: {
    fontSize: scaleText(12),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(16),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  trackControls: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    flexShrink: 0,
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(16),
    marginTop: scaleText(16),
    gap: scaleText(12),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
  },
  volumeSlider: {
    flex: 1,
    height: scaleText(6),
    position: 'relative',
    borderRadius: scaleText(3),
    overflow: 'hidden',
  },
  volumeTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.border,
  },
  volumeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  visualSection: {
    marginBottom: scaleText(40),
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scaleText(16),
  },
  activityCard: {
    width: currentTextScale.id === 'extra-large' ? '100%' : '48%',
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
    minHeight: scaleText(180),
  },
  specialActivityCard: {
    borderWidth: 3,
    borderColor: '#20B2AA',
    shadowColor: '#20B2AA',
    shadowOpacity: calmMode ? 0.15 : 0.25,
  },
  activityImage: {
    width: '100%',
    height: scaleText(120),
    backgroundColor: theme.colors.border,
  },
  activityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleText(16),
  },
  specialActivityOverlay: {
    backgroundColor: 'rgba(32, 178, 170, 0.8)',
  },
  activityIcon: {
    marginBottom: scaleText(8),
  },
  activityTitle: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scaleText(4),
    lineHeight: scaleText(24),
  },
  activityDescription: {
    fontSize: scaleText(14),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: scaleText(18),
  },
  comfortTipSection: {
    marginBottom: scaleText(20),
  },
  comfortTipCard: {
    backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1',
    borderRadius: scaleText(20),
    padding: scaleText(20),
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 105, 180, 0.3)' : '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.1 : 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  comfortTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleText(12),
  },
  comfortTipTitle: {
    fontSize: scaleText(20),
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: scaleText(26),
    flex: 1,
    marginLeft: scaleText(12),
  },
  refreshTipButton: {
    width: scaleText(36),
    height: scaleText(36),
    borderRadius: scaleText(18),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  comfortTipText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(24),
    fontStyle: 'italic',
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
});