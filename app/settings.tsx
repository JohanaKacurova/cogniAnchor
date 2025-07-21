import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { Volume2, Palette, MessageSquare, Moon, ZoomIn, CircleHelp as HelpCircle, ChevronRight, Sun, VolumeX } from 'lucide-react-native';
import { useTheme, colorThemes, textScales } from '@/contexts/ThemeContext';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import settingsConfig from '../config/settings.json';

function MySlider(props: any) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        min={props.minimumValue}
        max={props.maximumValue}
        value={props.value}
        onChange={e => props.onValueChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    );
  }
  return <Slider {...props} />;
}

export default function SettingsScreen() {
  const { currentTheme, currentTextScale, calmMode, setTheme, setTextScale, setCalmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  // Settings state
  const [soundVolume, setSoundVolume] = useState(settingsConfig.soundVolume);
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const router = useRouter();

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
  const voiceSpeeds = settingsConfig.voiceSpeeds;
  const handleNeedHelp = () => {
    console.log('Opening help tutorial');
    // In a real app, this would show instructions or play a tutorial
  };
  const playVoicePreview = (speed: string) => {
    console.log(`Playing voice preview at ${speed} speed`);
    // In a real app, this would play a sample voice message
  };
  const getVolumeIcon = () => {
    if (soundVolume === 0) return <VolumeX size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />;
    return <Volume2 size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />;
  };
  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);
  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}> 
      {/* Calm Mode Overlay */}
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
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Your Comfort Settings</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>Make the app just right for you</Text>
        </View>
        {/* Sound Volume */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.iconContainer}>
              {getVolumeIcon()}
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: getCalmModeTextColor() }]}>Sound Volume</Text>
              <Text style={[styles.settingDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>How loud should voices be?</Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <MySlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={soundVolume}
              onValueChange={setSoundVolume}
              minimumTrackTintColor={currentTheme.colors.primary}
              maximumTrackTintColor={calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border}
            />
            <View style={styles.volumePresets}>
              <TouchableOpacity 
                style={[
                  styles.presetButton, 
                  { 
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
                    borderColor: soundVolume <= 0.3 ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  soundVolume <= 0.3 && styles.activePreset
                ]}
                onPress={() => setSoundVolume(0.2)}
              >
                <Text style={[styles.presetText, { color: currentTheme.colors.primary }]}>Quiet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.presetButton, 
                  { 
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
                    borderColor: (soundVolume > 0.3 && soundVolume <= 0.7) ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  (soundVolume > 0.3 && soundVolume <= 0.7) && styles.activePreset
                ]}
                onPress={() => setSoundVolume(0.5)}
              >
                <Text style={[styles.presetText, { color: currentTheme.colors.primary }]}>Medium</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.presetButton, 
                  { 
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
                    borderColor: soundVolume > 0.7 ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  soundVolume > 0.7 && styles.activePreset
                ]}
                onPress={() => setSoundVolume(0.9)}
              >
                <Text style={[styles.presetText, { color: currentTheme.colors.primary }]}>Loud</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Voice Speed */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.iconContainer}>
              <MessageSquare size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: getCalmModeTextColor() }]}>Voice Speaking Speed</Text>
              <Text style={[styles.settingDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>How fast should voices talk?</Text>
            </View>
          </View>
          <View style={styles.speedOptionsContainer}>
            {voiceSpeeds.map((speed) => (
              <TouchableOpacity
                key={speed.id}
                style={[
                  styles.speedButton,
                  {
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
                    borderColor: voiceSpeed === speed.id ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  voiceSpeed === speed.id && styles.activeSpeedButton
                ]}
                onPress={() => {
                  setVoiceSpeed(speed.id);
                  playVoicePreview(speed.id);
                }}
              >
                <Text style={styles.speedEmoji}>{speed.icon}</Text>
                <Text style={[
                  styles.speedText,
                  { color: voiceSpeed === speed.id ? currentTheme.colors.primary : (calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary) },
                  voiceSpeed === speed.id && styles.activeSpeedText
                ]}>
                  {speed.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Color Theme */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.iconContainer}>
              <Palette size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: getCalmModeTextColor() }]}>Color Theme</Text>
              <Text style={[styles.settingDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Pick your favorite colors</Text>
            </View>
          </View>
          <View style={styles.colorOptionsContainer}>
            {colorThemes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.colorCard,
                  { 
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : currentTheme.colors.background,
                    borderColor: currentTheme.id === theme.id ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  currentTheme.id === theme.id && styles.activeColorCard
                ]}
                onPress={() => setTheme(theme.id)}
              >
                <View style={[
                  styles.colorSwatch, 
                  { backgroundColor: theme.colors.primary },
                  calmMode && styles.calmColorSwatch
                ]} />
                <Text style={[
                  styles.colorName, 
                  { color: currentTheme.id === theme.id ? currentTheme.colors.primary : getCalmModeTextColor() }
                ]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Text Size */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.iconContainer}>
              <ZoomIn size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: getCalmModeTextColor() }]}>Text Size</Text>
              <Text style={[styles.settingDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>Make text bigger or smaller</Text>
            </View>
          </View>
          <View style={styles.sizeOptionsContainer}>
            {textScales.map((scale) => (
              <TouchableOpacity
                key={scale.id}
                style={[
                  styles.sizeCard,
                  {
                    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background,
                    borderColor: currentTextScale.id === scale.id ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                  },
                  currentTextScale.id === scale.id && styles.activeSizeCard
                ]}
                onPress={() => setTextScale(scale.id)}
              >
                <Text style={[
                  styles.sizePreview,
                  { 
                    fontSize: scaleText(24), 
                    color: currentTextScale.id === scale.id ? currentTheme.colors.primary : (calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary)
                  },
                  currentTextScale.id === scale.id && styles.activeSizeText
                ]}>
                  Aa
                </Text>
                <Text style={[
                  styles.sizeName,
                  { color: currentTextScale.id === scale.id ? currentTheme.colors.primary : (calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary) },
                  currentTextScale.id === scale.id && styles.activeSizeText
                ]}>
                  {scale.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Comfort Mode */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.iconContainer}>
              {calmMode ? (
                <Moon size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
              ) : (
                <Sun size={scaleText(28)} color={currentTheme.colors.primary} strokeWidth={2} />
              )}
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: getCalmModeTextColor() }]}>Calm Mode</Text>
              <View style={styles.calmModeDescription}>
                <Text style={[styles.settingDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                  Dim screen and soften sounds for rest time
                </Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={calmMode}
                onValueChange={setCalmMode}
                trackColor={{ 
                  false: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border, 
                  true: calmMode ? '#C0C0C0' : currentTheme.colors.primary
                }}
                thumbColor="#FFFFFF"
                style={styles.switch}
              />
            </View>
          </View>
        </View>
        {/* Help Tutorial */}
        <TouchableOpacity 
          style={[styles.helpButton, { backgroundColor: calmMode ? 'rgba(107, 70, 193, 0.7)' : '#6B46C1' }]}
          onPress={handleNeedHelp}
          activeOpacity={0.8}
        >
          <View style={styles.helpIcon}>
            <HelpCircle size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help Using the App?</Text>
            <Text style={styles.helpSubtitle}>Tap here for simple instructions</Text>
          </View>
          <ChevronRight size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.ScrollView>
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/')}> 
          <Feather name="home" size={scaleText(24)} color={currentTheme.colors.primary} />
          <Text style={styles.navLabel}>My Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/schedule')}>
          <Feather name="calendar" size={scaleText(24)} color={currentTheme.colors.primary} />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/contacts')}>
          <Feather name="users" size={scaleText(24)} color={currentTheme.colors.primary} />
          <Text style={styles.navLabel}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={scaleText(24)} color={currentTheme.colors.primary} />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/profile')}>
          <Feather name="user" size={scaleText(24)} color={currentTheme.colors.primary} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean, currentTextScale: any) => StyleSheet.create({
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
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.accent,
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
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: scaleText(20),
    paddingTop: scaleText(20),
    paddingBottom: scaleText(30),
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: scaleText(30),
    paddingHorizontal: scaleText(10),
  },
  headerTitle: {
    fontSize: scaleText(32),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(8),
    lineHeight: scaleText(40),
  },
  headerSubtitle: {
    fontSize: scaleText(20),
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: scaleText(26),
  },
  settingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(20),
    marginBottom: scaleText(20),
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleText(20),
  },
  iconContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(12),
    marginRight: scaleText(16),
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: scaleText(24),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(8),
  },
  settingDescription: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  sliderContainer: {
    marginBottom: scaleText(20),
  },
  slider: {
    width: '100%',
    height: scaleText(40),
  },
  volumePresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 224, 0.7)', // Light yellow background
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleText(6),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    minHeight: scaleText(44),
  },
  presetText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.primary,
  },
  activePreset: {
    borderColor: theme.colors.primary,
  },
  speedOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    backgroundColor: 'rgba(255, 255, 224, 0.7)', // Light yellow background
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleText(6),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    minHeight: scaleText(44),
  },
  speedEmoji: {
    fontSize: scaleText(24),
    marginBottom: scaleText(8),
  },
  speedText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeSpeedButton: {
    borderColor: theme.colors.primary,
  },
  activeSpeedText: {
    color: theme.colors.primary,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCard: {
    backgroundColor: 'rgba(255, 255, 224, 0.7)', // Light yellow background
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleText(6),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    minHeight: scaleText(100),
  },
  colorSwatch: {
    width: '100%',
    height: '100%',
    borderRadius: scaleText(12),
  },
  calmColorSwatch: {
    opacity: 0.7,
  },
  colorName: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: scaleText(8),
  },
  activeColorCard: {
    borderColor: theme.colors.primary,
  },
  sizeOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeCard: {
    backgroundColor: 'rgba(255, 255, 224, 0.7)', // Light yellow background
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleText(6),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    minHeight: scaleText(100),
  },
  sizePreview: {
    fontSize: scaleText(24),
    color: theme.colors.textSecondary,
  },
  sizeName: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: scaleText(8),
  },
  activeSizeCard: {
    borderColor: theme.colors.primary,
  },
  activeSizeText: {
    color: theme.colors.primary,
  },
  calmModeDescription: {
    marginBottom: scaleText(16),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
  helpButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: scaleText(16),
    padding: scaleText(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpIcon: {
    backgroundColor: theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(12),
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: scaleText(24),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(8),
  },
  helpSubtitle: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleText(12),
    paddingTop: scaleText(8),
    paddingBottom: scaleText(8),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    zIndex: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(4),
  },
  navLabel: {
    fontSize: scaleText(12),
    color: theme.colors.primary,
    marginTop: scaleText(2),
    fontWeight: '500',
  },
}); 