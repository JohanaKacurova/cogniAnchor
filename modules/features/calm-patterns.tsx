import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Chrome as Home,
  Calendar,
  User,
  Settings,
  Phone
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface Pattern {
  id: string;
  name: string;
  description: string;
  colors: string[];
  type: 'breathing' | 'ripple' | 'mandala' | 'flow' | 'gradient' | 'particles';
}

const patterns: Pattern[] = [
  {
    id: 'breathing-circle',
    name: 'Breathing Circle',
    description: 'A gentle circle that breathes in and out',
    colors: ['#87CEEB', '#E6F3FF', '#B0E0E6'],
    type: 'breathing'
  },
  {
    id: 'water-ripples',
    name: 'Water Ripples',
    description: 'Peaceful ripples spreading across water',
    colors: ['#4682B4', '#87CEEB', '#E0F6FF'],
    type: 'ripple'
  },
  {
    id: 'mandala-rotation',
    name: 'Gentle Mandala',
    description: 'A slowly rotating mandala pattern',
    colors: ['#DDA0DD', '#E6E6FA', '#F8F0FF'],
    type: 'mandala'
  },
  {
    id: 'flowing-colors',
    name: 'Flowing Colors',
    description: 'Soft colors flowing like gentle waves',
    colors: ['#FFE4E1', '#FF69B4', '#FFF0F5'],
    type: 'flow'
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    description: 'Peaceful sunset colors blending together',
    colors: ['#FFE4B5', '#FFA07A', '#FFEFD5'],
    type: 'gradient'
  },
  {
    id: 'floating-particles',
    name: 'Floating Lights',
    description: 'Gentle lights floating like fireflies',
    colors: ['#F0FFF0', '#98FB98', '#E0FFE0'],
    type: 'particles'
  }
];

const ambientSounds = [
  { id: 'waves', name: 'Ocean Waves', icon: '🌊' },
  { id: 'rain', name: 'Gentle Rain', icon: '🌧️' },
  { id: 'wind', name: 'Soft Wind', icon: '🍃' },
  { id: 'chimes', name: 'Wind Chimes', icon: '🎐' },
  { id: 'silence', name: 'Peaceful Silence', icon: '🤫' }
];

type TabRoute = '/' | '/schedule' | '/contacts' | '/profile' | '/settings';

export default function CalmPatternsScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentSound, setCurrentSound] = useState('silence');
  const [showControls, setShowControls] = useState(true);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;

  // Animation refs for different patterns
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const mandalaAnim = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(Math.random()),
      y: new Animated.Value(Math.random()),
      opacity: new Animated.Value(Math.random() * 0.8 + 0.2),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5)
    }))
  ).current;

  const currentPattern = patterns[currentPatternIndex];
  const screenWidth = width;
  const screenHeight = height;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Auto-hide controls after 5 seconds
    const controlsTimer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(controlsTimer);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startPatternAnimation();
    } else {
      stopPatternAnimation();
    }
  }, [currentPatternIndex, isPlaying]);

  const startPatternAnimation = () => {
    const pattern = patterns[currentPatternIndex];
    
    switch (pattern.type) {
      case 'breathing':
        startBreathingAnimation();
        break;
      case 'ripple':
        startRippleAnimation();
        break;
      case 'mandala':
        startMandalaAnimation();
        break;
      case 'flow':
        startFlowAnimation();
        break;
      case 'gradient':
        startGradientAnimation();
        break;
      case 'particles':
        startParticleAnimation();
        break;
    }
  };

  const stopPatternAnimation = () => {
    breathingAnim.stopAnimation();
    rippleAnim.stopAnimation();
    mandalaAnim.stopAnimation();
    flowAnim.stopAnimation();
    gradientAnim.stopAnimation();
    particleAnims.forEach(anim => {
      anim.x.stopAnimation();
      anim.y.stopAnimation();
      anim.opacity.stopAnimation();
      anim.scale.stopAnimation();
    });
  };

  const startBreathingAnimation = () => {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isPlaying && currentPattern.type === 'breathing') {
          breathe();
        }
      });
    };
    breathe();
  };

  const startRippleAnimation = () => {
    const ripple = () => {
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying && currentPattern.type === 'ripple') {
          setTimeout(ripple, 1000);
        }
      });
    };
    ripple();
  };

  const startMandalaAnimation = () => {
    const rotate = () => {
      Animated.timing(mandalaAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying && currentPattern.type === 'mandala') {
          mandalaAnim.setValue(0);
          rotate();
        }
      });
    };
    rotate();
  };

  const startFlowAnimation = () => {
    const flow = () => {
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying && currentPattern.type === 'flow') {
          flowAnim.setValue(0);
          flow();
        }
      });
    };
    flow();
  };

  const startGradientAnimation = () => {
    const gradient = () => {
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying && currentPattern.type === 'gradient') {
          gradientAnim.setValue(0);
          gradient();
        }
      });
    };
    gradient();
  };

  const startParticleAnimation = () => {
    const animateParticles = () => {
      const animations = particleAnims.map(particle => {
        return Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(particle.x, {
                toValue: Math.random(),
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random(),
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.y, {
                toValue: Math.random(),
                duration: 10000 + Math.random() * 5000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: Math.random(),
                duration: 10000 + Math.random() * 5000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      });

      Animated.parallel(animations).start();
    };

    if (isPlaying && currentPattern.type === 'particles') {
      animateParticles();
    }
  };

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

  const handlePreviousPattern = () => {
    setCurrentPatternIndex(prev => 
      prev === 0 ? patterns.length - 1 : prev - 1
    );
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleNextPattern = () => {
    setCurrentPatternIndex(prev => 
      prev === patterns.length - 1 ? 0 : prev + 1
    );
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleSoundToggle = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
      setCurrentSound('waves');
      console.log('Playing ambient sound: Ocean Waves');
    } else {
      setSoundEnabled(false);
      setCurrentSound('silence');
      console.log('Stopping ambient sound');
    }
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleSoundChange = (soundId: string) => {
    setCurrentSound(soundId);
    setSoundEnabled(soundId !== 'silence');
    console.log('Changing ambient sound to:', soundId);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleScreenTap = () => {
    setShowControls(!showControls);
    if (!showControls) {
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleReset = () => {
    stopPatternAnimation();
    // Reset all animations to initial state
    breathingAnim.setValue(1);
    rippleAnim.setValue(0);
    mandalaAnim.setValue(0);
    flowAnim.setValue(0);
    gradientAnim.setValue(0);
    particleAnims.forEach(particle => {
      particle.x.setValue(Math.random());
      particle.y.setValue(Math.random());
      particle.opacity.setValue(Math.random() * 0.8 + 0.2);
      particle.scale.setValue(Math.random() * 0.5 + 0.5);
    });
    
    if (isPlaying) {
      startPatternAnimation();
    }
    
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const renderPattern = () => {
    const pattern = patterns[currentPatternIndex];
    
    switch (pattern.type) {
      case 'breathing':
        return (
          <Animated.View style={[
            styles.breathingCircle,
            {
              backgroundColor: pattern.colors[0],
              transform: [{ scale: breathingAnim }],
              shadowColor: pattern.colors[1],
            }
          ]}>
            <View style={[styles.innerCircle, { backgroundColor: pattern.colors[1] }]}>
              <View style={[styles.centerDot, { backgroundColor: pattern.colors[2] }]} />
            </View>
          </Animated.View>
        );

      case 'ripple':
        return (
          <View style={styles.rippleContainer}>
            {[0, 1, 2].map(index => (
              <Animated.View
                key={index}
                style={[
                  styles.rippleRing,
                  {
                    borderColor: pattern.colors[index],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0.8, 0],
                    }),
                    transform: [{
                      scale: rippleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 2 + index * 0.5],
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        );

      case 'mandala':
        return (
          <Animated.View style={[
            styles.mandalaContainer,
            {
              transform: [{
                rotate: mandalaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}>
            {[0, 1, 2, 3, 4, 5].map(index => (
              <View
                key={index}
                style={[
                  styles.mandalaSegment,
                  {
                    backgroundColor: pattern.colors[index % pattern.colors.length],
                    transform: [{ rotate: `${index * 60}deg` }],
                  }
                ]}
              />
            ))}
          </Animated.View>
        );

      case 'flow':
        return (
          <View style={styles.flowContainer}>
            {[0, 1, 2, 3].map(index => (
              <Animated.View
                key={index}
                style={[
                  styles.flowWave,
                  {
                    backgroundColor: pattern.colors[index % pattern.colors.length],
                    opacity: 0.6,
                    transform: [{
                      translateX: flowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-screenWidth, screenWidth],
                      })
                    }, {
                      translateY: index * 50 - 100
                    }]
                  }
                ]}
              />
            ))}
          </View>
        );

      case 'gradient':
        return (
          <Animated.View style={[
            styles.gradientContainer,
            {
              opacity: gradientAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1, 0.8],
              })
            }
          ]}>
            <View style={[styles.gradientLayer, { backgroundColor: pattern.colors[0] }]} />
            <View style={[styles.gradientLayer, { backgroundColor: pattern.colors[1], opacity: 0.7 }]} />
            <View style={[styles.gradientLayer, { backgroundColor: pattern.colors[2], opacity: 0.5 }]} />
          </Animated.View>
        );

      case 'particles':
        return (
          <View style={styles.particleContainer}>
            {particleAnims.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: pattern.colors[index % pattern.colors.length],
                    opacity: particle.opacity,
                    transform: [
                      {
                        translateX: particle.x.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, screenWidth - 20],
                        })
                      },
                      {
                        translateY: particle.y.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, screenHeight - 200],
                        })
                      },
                      { scale: particle.scale }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale, width, height, isSmallScreen, isLargeScreen);

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}>
      {calmMode && <View style={styles.calmOverlay} />}
      
      {/* Sticky Date/Time Header - Only show if controls are visible */}
      {showControls && (
        <Animated.View style={[styles.stickyHeader, { opacity: fadeAnim }]}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.timeWrapper}>
              <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
            </View>
            <Text style={[styles.date, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{formatDate(currentTime)}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header - Only show if controls are visible */}
      {showControls && (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={scaleText(24)} color={getCalmModeTextColor()} strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>🌀 Calm Patterns</Text>
            <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
              Relax with slow, soothing visuals
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Main Pattern Display */}
      <TouchableOpacity 
        style={styles.patternDisplay}
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        <Animated.View style={[styles.patternContainer, { opacity: fadeAnim }]}>
          {renderPattern()}
        </Animated.View>
      </TouchableOpacity>

      {/* Pattern Info - Only show if controls are visible */}
      {showControls && (
        <Animated.View style={[styles.patternInfo, { opacity: fadeAnim }]}>
          <Text style={[styles.patternName, { color: getCalmModeTextColor() }]}>
            {currentPattern.name}
          </Text>
          <Text style={[styles.patternDescription, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>
            {currentPattern.description}
          </Text>
        </Animated.View>
      )}

      {/* Controls - Only show if controls are visible */}
      {showControls && (
        <Animated.View style={[styles.controlsContainer, { opacity: fadeAnim }]}>
          {/* Pattern Navigation */}
          <View style={styles.patternControls}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePreviousPattern}
              activeOpacity={0.7}
            >
              <ChevronLeft size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              {isPlaying ? (
                <Pause size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Play size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextPattern}
              activeOpacity={0.7}
            >
              <ChevronRight size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Additional Controls */}
          <View style={styles.additionalControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleSoundToggle}
              activeOpacity={0.7}
            >
              {soundEnabled ? (
                <Volume2 size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
              ) : (
                <VolumeX size={scaleText(24)} color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <RotateCcw size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Sound Selection */}
          {soundEnabled && (
            <View style={styles.soundSelection}>
              <Text style={[styles.soundTitle, { color: getCalmModeTextColor() }]}>
                Ambient Sound:
              </Text>
              <View style={styles.soundOptions}>
                {ambientSounds.slice(0, 4).map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundButton,
                      currentSound === sound.id && styles.soundButtonActive
                    ]}
                    onPress={() => handleSoundChange(sound.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.soundEmoji}>{sound.icon}</Text>
                    <Text style={[
                      styles.soundName,
                      { color: currentSound === sound.id ? '#FFFFFF' : (calmMode ? '#A0A0A0' : currentTheme.colors.text) }
                    ]}>
                      {sound.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Bottom Navigation - Only show if controls are visible */}
      {showControls && (
        <Animated.View style={[styles.bottomNavigation, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.navTabButton}
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
            style={styles.navTabButton}
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
            style={styles.navTabButton}
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
            style={styles.navTabButton}
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
            style={styles.navTabButton}
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
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean, currentTextScale: any, width: number, height: number, isSmallScreen: boolean, isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: calmMode ? '#000000' : '#1a1a2e',
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
  },
  calmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  stickyHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingVertical: scaleText(12),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    minHeight: isSmallScreen ? scaleText(100) : scaleText(80),
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: scaleText(8),
  },
  timeWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: scaleText(80),
  },
  time: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  date: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: '#B0B0B0',
    textAlign: 'right',
    flex: 1,
    marginLeft: scaleText(16),
    flexShrink: 1,
  },
  header: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: isSmallScreen ? 'stretch' : currentTextScale.id === 'extra-large' ? 'stretch' : 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingVertical: scaleText(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 999,
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(80),
    gap: isSmallScreen ? scaleText(8) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  backButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFFFFF',
    lineHeight: scaleText(35),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: '#B0B0B0',
    lineHeight: scaleText(24),
    marginTop: scaleText(4),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    maxWidth: currentTextScale.id === 'extra-large' ? '90%' : '100%',
  },
  patternDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  patternContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Breathing Circle Pattern
  breathingCircle: {
    width: scaleText(300),
    height: scaleText(300),
    borderRadius: scaleText(150),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    width: scaleText(200),
    height: scaleText(200),
    borderRadius: scaleText(100),
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  centerDot: {
    width: scaleText(60),
    height: scaleText(60),
    borderRadius: scaleText(30),
    opacity: 0.9,
  },
  // Ripple Pattern
  rippleContainer: {
    width: scaleText(400),
    height: scaleText(400),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: scaleText(100),
    height: scaleText(100),
    borderRadius: scaleText(50),
    borderWidth: 3,
  },
  // Mandala Pattern
  mandalaContainer: {
    width: scaleText(250),
    height: scaleText(250),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandalaSegment: {
    position: 'absolute',
    width: scaleText(80),
    height: scaleText(20),
    borderRadius: scaleText(10),
    opacity: 0.7,
  },
  // Flow Pattern
  flowContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowWave: {
    position: 'absolute',
    width: scaleText(400),
    height: scaleText(60),
    borderRadius: scaleText(30),
  },
  // Gradient Pattern
  gradientContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // Particle Pattern
  particleContainer: {
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: scaleText(20),
    height: scaleText(20),
    borderRadius: scaleText(10),
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  patternInfo: {
    position: 'absolute',
    bottom: scaleText(200),
    left: scaleText(20),
    right: scaleText(20),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scaleText(16),
    padding: scaleText(20),
    alignItems: 'center',
    zIndex: 1000,
  },
  patternName: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scaleText(8),
    lineHeight: scaleText(30),
  },
  patternDescription: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: scaleText(22),
  },
  controlsContainer: {
    position: 'absolute',
    bottom: scaleText(120),
    left: scaleText(20),
    right: scaleText(20),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: scaleText(20),
    padding: scaleText(20),
    zIndex: 1000,
  },
  patternControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleText(20),
    marginBottom: scaleText(16),
  },
  navButton: {
    width: scaleText(60),
    height: scaleText(60),
    borderRadius: scaleText(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButton: {
    width: scaleText(80),
    height: scaleText(80),
    borderRadius: scaleText(40),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleText(20),
    marginBottom: scaleText(16),
  },
  controlButton: {
    width: scaleText(50),
    height: scaleText(50),
    borderRadius: scaleText(25),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  soundSelection: {
    alignItems: 'center',
  },
  soundTitle: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scaleText(12),
    lineHeight: scaleText(20),
  },
  soundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scaleText(8),
  },
  soundButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scaleText(12),
    paddingHorizontal: scaleText(12),
    paddingVertical: scaleText(8),
    gap: scaleText(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: scaleText(80),
  },
  soundButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  soundEmoji: {
    fontSize: scaleText(16),
    lineHeight: scaleText(20),
  },
  soundName: {
    fontSize: scaleText(12),
    fontWeight: '500',
    lineHeight: scaleText(16),
    textAlign: 'center',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    height: Math.max(85, scaleText(85)),
    paddingBottom: scaleText(15),
    paddingTop: scaleText(8),
    zIndex: 1000,
  },
  navTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(8),
  },
  navLabel: {
    fontSize: scaleText(12),
    fontWeight: '600',
    marginTop: scaleText(4),
    lineHeight: scaleText(16),
    textAlign: 'center',
  },
});