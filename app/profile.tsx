import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { Headphones, Camera, Circle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePatient } from '../modules/contexts/PatientContext';

export default function ProfileScreen() {
  const { currentTheme, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { patient, updatePatient } = usePatient();

  useEffect(() => {
    // Gentle fade-in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Update time every minute
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

  const handlePlayComfortMessage = () => {
    console.log('Playing comfort message');
    // In a real app, this would play an audio file
  };

  const handleViewFamilyAlbum = () => {
    console.log('Opening family album');
    // In a real app, this would navigate to a photo gallery
  };

  const styles = createStyles(currentTheme, scaleText, calmMode);

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
        {/* Welcome Message */}
        <Animated.View 
          style={[
            styles.welcomeCard,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={[styles.welcomeText, { color: getCalmModeTextColor() }]}>Hello there!</Text>
          <View style={styles.profileIconContainer}>
            <Text style={[styles.profileEmoji, { color: currentTheme.colors.primary }]}>👤</Text>
          </View>
          <TextInput
            style={[styles.profileName, { color: getCalmModeTextColor() }]}
            value={patient.name}
            onChangeText={name => updatePatient({ name })}
            placeholder="Enter your name"
            placeholderTextColor={calmMode ? '#B0B0B0' : '#888'}
            accessibilityLabel="Patient Name"
            maxLength={32}
            textAlign="center"
            returnKeyType="done"
          />
          <Text style={[styles.profileSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>You are {patient.age} years young! 🌸</Text>
        </Animated.View>
        {/* Personal Details - More Conversational */}
        <View style={styles.detailsSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>A Little About You</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailEmoji}>🎂</Text>
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: getCalmModeTextColor() }]}>Your special day is</Text>
                <Text style={[styles.detailValue, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>{patient.birthday}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailEmoji}>🏠</Text>
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: getCalmModeTextColor() }]}>You live in beautiful</Text>
                <Text style={[styles.detailValue, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>{patient.location}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailEmoji}>❤️</Text>
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: getCalmModeTextColor() }]}>Your family loves you</Text>
                <Text style={[styles.detailValue, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>
                  {/* Example: show first two family members if available */}
                  {patient.family.familyMembers.length > 0
                    ? patient.family.familyMembers.map(m => m.name).slice(0, 2).join(' & ')
                    : 'Your family'}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailEmoji}>💙</Text>
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: getCalmModeTextColor() }]}>You love the color</Text>
                <Text style={[styles.detailValue, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>{patient.personalDetails.favoriteColor} & {patient.personalDetails.favoriteAnimal}</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Comfort Actions - More Personal */}
        <View style={styles.comfortSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>Something Special</Text>
          <TouchableOpacity 
            style={[styles.comfortButton, styles.messageButton]}
            onPress={handlePlayComfortMessage}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonEmoji}>🎧</Text>
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Hear a Sweet Message</Text>
              <Text style={styles.buttonSubtitle}>From someone who loves you</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.comfortButton, styles.albumButton]}
            onPress={handleViewFamilyAlbum}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonEmoji}>📷</Text>
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>See Happy Memories</Text>
              <Text style={styles.buttonSubtitle}>Photos of your loved ones</Text>
            </View>
          </TouchableOpacity>
        </View>
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

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean) => StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: scaleText(12),
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
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
    borderColor: theme.colors.accent,
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
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: scaleText(20),
    paddingBottom: scaleText(30),
  },
  welcomeCard: {
    backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1',
    borderRadius: scaleText(30),
    padding: scaleText(30),
    alignItems: 'center',
    marginBottom: scaleText(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: calmMode ? 0.08 : 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.accent,
  },
  welcomeText: {
    fontSize: scaleText(28),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(15),
    textAlign: 'center',
    lineHeight: scaleText(35),
  },
  profileIconContainer: {
    width: scaleText(150),
    height: scaleText(150),
    borderRadius: scaleText(75),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: theme.colors.surface,
    marginBottom: scaleText(20),
  },
  profileEmoji: {
    fontSize: scaleText(80),
    lineHeight: scaleText(90),
  },
  profileName: {
    fontSize: scaleText(38),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(8),
    lineHeight: scaleText(45),
  },
  profileSubtitle: {
    fontSize: scaleText(24),
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: scaleText(30),
  },
  detailsSection: {
    marginBottom: scaleText(25),
  },
  sectionTitle: {
    fontSize: scaleText(30),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(20),
    lineHeight: scaleText(38),
  },
  detailCard: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(25),
    padding: scaleText(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.05 : 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: scaleText(18),
    borderBottomWidth: 1,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    minHeight: scaleText(80),
  },
  iconContainer: {
    width: scaleText(50),
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: scaleText(5),
  },
  detailEmoji: {
    fontSize: scaleText(32),
    lineHeight: scaleText(36),
  },
  detailText: {
    marginLeft: scaleText(20),
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: scaleText(4),
    lineHeight: scaleText(24),
  },
  detailValue: {
    fontSize: scaleText(22),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    lineHeight: scaleText(28),
    flexWrap: 'wrap',
  },
  comfortSection: {
    marginBottom: scaleText(20),
  },
  comfortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleText(25),
    padding: scaleText(25),
    marginBottom: scaleText(18),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.08 : 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: scaleText(130),
  },
  messageButton: {
    backgroundColor: calmMode ? 'rgba(218, 112, 214, 0.7)' : '#DA70D6',
  },
  albumButton: {
    backgroundColor: calmMode ? 'rgba(32, 178, 170, 0.7)' : '#20B2AA',
  },
  buttonIcon: {
    width: scaleText(70),
    height: scaleText(70),
    borderRadius: scaleText(35),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleText(20),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },
  buttonEmoji: {
    fontSize: scaleText(36),
    lineHeight: scaleText(40),
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scaleText(10),
  },
  buttonTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleText(6),
    lineHeight: scaleText(30),
    flexWrap: 'wrap',
  },
  buttonSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: scaleText(24),
    flexWrap: 'wrap',
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