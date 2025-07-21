import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import calmPatternsConfig from '../../config/calm-patterns.json';
import { useTheme } from '../../modules/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Chrome as Home,
  Calendar,
  User,
  Settings,
  Phone
} from 'lucide-react-native';

const patterns = calmPatternsConfig.patterns;

export default function CalmPatternsScreen() {
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const { width } = useWindowDimensions();
  const currentPattern = patterns[currentPatternIndex];
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const handleGoBack = () => router.push('/calm-zone');
  const handleTabPress = (route) => router.push(route);

  // Animation refs
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
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }))
  ).current;

  // Start/stop pattern animation on pattern change
  useEffect(() => {
    stopAllAnimations();
    switch (currentPattern.type) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatternIndex]);

  function stopAllAnimations() {
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
  }

  function startBreathingAnimation() {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(breathingAnim, { toValue: 1.3, duration: 4000, useNativeDriver: true }),
        Animated.timing(breathingAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ]).start(() => breathe());
    };
    breathe();
  }

  function startRippleAnimation() {
    const ripple = () => {
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, { toValue: 1, duration: 3000, useNativeDriver: true }).start(() => setTimeout(ripple, 1000));
    };
    ripple();
  }

  function startMandalaAnimation() {
    const rotate = () => {
      Animated.timing(mandalaAnim, { toValue: 1, duration: 20000, useNativeDriver: true }).start(() => {
        mandalaAnim.setValue(0);
        rotate();
      });
    };
    rotate();
  }

  function startFlowAnimation() {
    const flow = () => {
      Animated.timing(flowAnim, { toValue: 1, duration: 6000, useNativeDriver: true }).start(() => {
        flowAnim.setValue(0);
        flow();
      });
    };
    flow();
  }

  function startGradientAnimation() {
    const gradient = () => {
      Animated.timing(gradientAnim, { toValue: 1, duration: 8000, useNativeDriver: true }).start(() => {
        gradientAnim.setValue(0);
        gradient();
      });
    };
    gradient();
  }

  function startParticleAnimation() {
    const animateParticles = () => {
      particleAnims.forEach(anim => {
        Animated.parallel([
          Animated.timing(anim.x, { toValue: Math.random(), duration: 4000, useNativeDriver: true }),
          Animated.timing(anim.y, { toValue: Math.random(), duration: 4000, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: Math.random() * 0.8 + 0.2, duration: 4000, useNativeDriver: true }),
          Animated.timing(anim.scale, { toValue: Math.random() * 0.5 + 0.5, duration: 4000, useNativeDriver: true }),
        ]).start();
      });
      setTimeout(animateParticles, 4000);
    };
    animateParticles();
  }

  // Pattern renderers
  function renderPattern() {
    switch (currentPattern.type) {
      case 'breathing':
        return (
          <Animated.View
            style={[
              styles.patternCircle,
              {
                backgroundColor: currentPattern.colors[0],
                transform: [{ scale: breathingAnim }],
                width: width * 0.5,
                height: width * 0.5,
              },
            ]}
          />
        );
      case 'ripple':
        return (
          <View style={styles.rippleContainer}>
            {[0, 1, 2].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.rippleCircle,
                  {
                    borderColor: currentPattern.colors[i % currentPattern.colors.length],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1 - i * 0.3, 0],
                    }),
                    transform: [
                      {
                        scale: rippleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1 + i * 0.2, 2 + i * 0.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        );
      case 'mandala':
        return (
          <Animated.View
            style={{
              width: width * 0.6,
              height: width * 0.6,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                {
                  rotate: mandalaAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: width * 0.15,
                  height: width * 0.15,
                  borderRadius: 9999,
                  backgroundColor: currentPattern.colors[i % currentPattern.colors.length],
                  left: width * 0.3 + Math.cos((i / 8) * 2 * Math.PI) * width * 0.22 - width * 0.075,
                  top: width * 0.3 + Math.sin((i / 8) * 2 * Math.PI) * width * 0.22 - width * 0.075,
                }}
              />
            ))}
          </Animated.View>
        );
      case 'flow':
        return (
          <Animated.View
            style={{
              width: width * 0.7,
              height: width * 0.2,
              borderRadius: width * 0.1,
              backgroundColor: currentPattern.colors[0],
              opacity: flowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              transform: [
                {
                  translateX: flowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width * 0.2, width * 0.2],
                  }),
                },
              ],
            }}
          />
        );
      case 'gradient':
        return (
          <Animated.View
            style={{
              width: width * 0.7,
              height: width * 0.7,
              borderRadius: width * 0.35,
              backgroundColor: currentPattern.colors[0],
              opacity: gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
              shadowColor: currentPattern.colors[1],
              shadowOpacity: 0.7,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      case 'particles':
        return (
          <View style={{ width: width * 0.7, height: width * 0.7 }}>
            {particleAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: anim.x.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.7 - 30] }),
                  top: anim.y.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.7 - 30] }),
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: currentPattern.colors[i % currentPattern.colors.length],
                  opacity: anim.opacity,
                  transform: [{ scale: anim.scale }],
                }}
              />
            ))}
          </View>
        );
      default:
        return null;
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
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
      backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : currentTheme.colors.background,
      paddingHorizontal: scaleText(20),
      paddingVertical: scaleText(12),
      borderBottomWidth: 0.5,
      borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
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
      backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface,
      paddingHorizontal: scaleText(16),
      paddingVertical: scaleText(8),
      borderRadius: scaleText(16),
      borderWidth: 1,
      borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.accent,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
      minWidth: scaleText(80),
    },
    time: {
      fontSize: scaleText(18),
      fontWeight: '600',
      color: currentTheme.colors.text,
      textAlign: 'center',
    },
    date: {
      fontSize: scaleText(16),
      fontWeight: '500',
      color: currentTheme.colors.primary,
      textAlign: 'right',
      flex: 1,
      marginLeft: scaleText(16),
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : currentTheme.colors.surface,
      paddingHorizontal: scaleText(20),
      paddingVertical: scaleText(16),
      borderBottomWidth: 1,
      borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: calmMode ? 0.05 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 999,
      minHeight: scaleText(80),
    },
    backButton: {
      width: scaleText(44),
      height: scaleText(44),
      borderRadius: scaleText(22),
      backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: scaleText(16),
      borderWidth: 1,
      borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border,
    },
    headerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: scaleText(26),
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      lineHeight: scaleText(32),
      textAlign: 'left',
    },
    headerSubtitle: {
      fontSize: scaleText(15),
      fontWeight: '500',
      color: currentTheme.colors.primary,
      lineHeight: scaleText(20),
      marginTop: scaleText(4),
      textAlign: 'left',
      maxWidth: '100%',
    },
    scrollView: {
      flex: 1,
      zIndex: 2,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: scaleText(20),
      paddingTop: scaleText(20),
      paddingBottom: scaleText(120),
    },
    bottomNavigation: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : currentTheme.colors.surface,
      paddingVertical: scaleText(10),
      paddingHorizontal: scaleText(20),
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 3,
    },
    navButton: {
      alignItems: 'center',
    },
    navLabel: {
      fontSize: scaleText(12),
      marginTop: scaleText(4),
    },
    patternName: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
    patternDescription: { fontSize: 16, color: '#555', marginBottom: 24, textAlign: 'center', paddingHorizontal: 20 },
    patternContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    patternCircle: { borderRadius: 9999 },
    rippleContainer: { alignItems: 'center', justifyContent: 'center', width: 250, height: 250 },
    rippleCircle: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 6,
      borderColor: '#87CEEB',
    },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    button: { backgroundColor: '#87CEEB', padding: 12, borderRadius: 8, marginHorizontal: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  });

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
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Calm Patterns</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>Slow, soothing visual patterns for relaxation</Text>
        </View>
      </View>
      <Animated.ScrollView
        style={[styles.scrollView]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.patternName, { color: getCalmModeTextColor() }]}>{currentPattern.name}</Text>
        <Text style={[styles.patternDescription, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>{currentPattern.description}</Text>
        <View style={styles.patternContainer}>{renderPattern()}</View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCurrentPatternIndex((currentPatternIndex - 1 + patterns.length) % patterns.length)}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCurrentPatternIndex((currentPatternIndex + 1) % patterns.length)}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/(tabs)/')}
          activeOpacity={0.7}
        >
          <Home
            size={scaleText(22)}
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>My Day</Text>
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
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Schedule</Text>
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
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Contacts</Text>
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
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Profile</Text>
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
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}