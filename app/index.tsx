import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScheduleCard from '../modules/core/components/ScheduleCard';
import { useTheme } from '@/contexts/ThemeContext';
import { usePatient } from '../modules/contexts/PatientContext';
import { useSchedule } from '../modules/contexts/ScheduleContext';
import { Audio } from 'expo-av';
import { useContacts } from '../modules/contexts/ContactsContext';
import { useVoiceAssistant } from '../modules/contexts/VoiceAssistantContext';
import { getDueReminders } from '../modules/core/utils/reminders';

export default function MyDayScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { patient } = usePatient();
  const { getEntriesForDate } = useSchedule();
  const { contacts } = useContacts();
  const todayStr = currentTime.toISOString().slice(0, 10);
  const todayEntries = getEntriesForDate(todayStr);
  const [stepsModalVisible, setStepsModalVisible] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { speak } = useVoiceAssistant();

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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleVoicePrompt = async (voicePromptUrl?: string, title?: string) => {
    if (voicePromptUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: voicePromptUrl });
        await sound.playAsync();
      } catch (e) {
        alert('Could not play the voice prompt.');
      }
    } else {
      alert(title ? `No voice prompt for ${title}` : 'No voice prompt available.');
    }
  };

  const handlePlayMemory = () => {
    router.push({ pathname: '/memory-lane' });
  };

  const handleRecordThought = () => {
    router.push({ pathname: '/record-thought' });
  };

  const handleCalmZone = () => {
    router.push({ pathname: '/calm-zone' });
  };

  const getStepsForItem = (item) => {
    if (item.activityName && item.activityName.toLowerCase().includes('walk')) {
      return [
        { text: 'Put on your shoes.', image: '', audio: '' },
        { text: 'Take your water bottle.', image: '', audio: '' },
        { text: 'Meet Sarah at the front door.', image: '', audio: '' },
        { text: 'Enjoy your walk!', image: '', audio: '' },
      ];
    }
    return null;
  };

  const handleShowSteps = (item) => {
    const steps = getStepsForItem(item);
    if (steps) {
      setCurrentSteps(steps);
      setCurrentStepIndex(0);
      setStepsModalVisible(true);
    }
  };

  const getReminderMessage = (item) => {
    if (item.activityName && item.assignedContact) {
      const caregiver = contacts.find(c => c.id === item.assignedContact);
      if (caregiver) {
        if (item.activityName.toLowerCase().includes('walk')) {
          return `It's time for your walk with ${caregiver.name}. Remember your shoes!`;
        }
        return `It's time for ${item.activityName.toLowerCase()} with ${caregiver.name}.`;
      }
    }
    return undefined;
  };

  // Enhanced contextual reminder message
  const buildReminderMessage = (item) => {
    const hour = currentTime.getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    const patientName = patient.name;
    const activityTime = formatTime(new Date(`${item.date}T${item.time}`));
    const activity = item.activityName || 'your activity';
    let caregiverName = '';
    if (item.assignedContact) {
      const caregiver = contacts.find(c => c.id === item.assignedContact);
      if (caregiver) caregiverName = caregiver.name;
    }
    let msg = `${greeting}, ${patientName}! It's ${activityTime}, time for ${activity.toLowerCase()}.`;
    if (caregiverName) msg += ` ${caregiverName} will be here soon.`;
    return msg;
  };

  // --- Helper functions for enhanced greeting ---
  const getSeason = (date: Date) => {
    const month = date.getMonth() + 1;
    if (month === 12 || month === 1 || month === 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  };

  const getHoliday = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    // Demo: only a few major US holidays
    if (m === 1 && d === 1) return "New Year's Day";
    if (m === 7 && d === 4) return "Independence Day";
    // Thanksgiving: 4th Thursday of November
    if (m === 11) {
      const thursdays = Array.from({length: 30}, (_, i) => new Date(y, 10, i+1)).filter(dt => dt.getDay() === 4);
      if (d === thursdays[3].getDate()) return 'Thanksgiving';
    }
    if (m === 12 && d === 25) return 'Christmas';
    return null;
  };

  const getWeatherString = () => {
    // Mock: could be replaced with real API
    if (patient.location) return `It's a beautiful day in ${patient.location}.`;
    return '';
  };

  const getSeasonalContext = (season: string) => {
    switch (season) {
      case 'spring': return "It's spring and the flowers are blooming.";
      case 'summer': return "It's summer and the days are warm.";
      case 'fall': return "It's fall and the leaves are turning colors.";
      case 'winter': return "It's winter and it might be chilly outside.";
      default: return '';
    }
  };

  const getGreetingStyle = () => {
    // Only use greetingStyle if it exists
    if (patient.preferences && 'greetingStyle' in patient.preferences && patient.preferences.greetingStyle) {
      // @ts-ignore
      return patient.preferences.greetingStyle;
    }
    return 'friendly';
  };

  const buildGreeting = () => {
    const greeting = getGreeting();
    const name = patient.name;
    const dateStr = formatDate(currentTime);
    const weather = getWeatherString();
    const season = getSeason(currentTime);
    const seasonContext = getSeasonalContext(season);
    const holiday = getHoliday(currentTime);
    const style = getGreetingStyle();
    let base = '';
    if (style === 'formal') {
      base = `${greeting}, ${name}. Today is ${dateStr}. ${weather} ${seasonContext}`;
    } else if (style === 'cheerful') {
      base = `${greeting}, ${name}! ${weather} ${seasonContext} Today is ${dateStr}.`;
    } else {
      // friendly (default)
      base = `${greeting}, ${name}! Today is ${dateStr}. ${weather} ${seasonContext}`;
    }
    if (holiday) base += ` Happy ${holiday}!`;
    return base.trim();
  };

  const dueReminders = getDueReminders({ scheduleEntries: todayEntries, patient, contacts, now: currentTime });

  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}> 
      {calmMode && <View style={styles.calmOverlay} />}
      <View style={styles.stickyHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
          </View>
        </View>
      </View>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Show due reminders at the top of scroll content */}
        {dueReminders.length > 0 && (
          <View style={{ marginBottom: scaleText(16) }}>
            {dueReminders.map((rem, idx) => (
              <View key={idx} style={styles.reminderBanner}>
                <Text style={[styles.reminderText, { color: getCalmModeTextColor(), fontSize: scaleText(18), fontWeight: '600', textAlign: 'center' }]}>{rem.message}</Text>
                <TouchableOpacity
                  onPress={() => speak(rem.message)}
                  style={{ marginTop: 4, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}
                  accessibilityLabel={`Hear reminder: ${rem.message}`}
                  accessibilityRole="button"
                >
                  <Feather name="volume-2" size={scaleText(18)} color={currentTheme.colors.primary} />
                  <Text style={{ color: currentTheme.colors.primary, fontSize: scaleText(14), fontWeight: '600', marginLeft: 6 }}>Hear Reminder</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Greeting banner at the top of scroll content */}
        <View style={styles.greetingBanner}>
          <Text style={[styles.greeting, { color: getCalmModeTextColor(), fontSize: scaleText(28), fontWeight: '700', marginBottom: scaleText(2), textAlign: 'center' }]}> 
            {buildGreeting()}
          </Text>
          <TouchableOpacity
            onPress={() => speak(buildGreeting())}
            style={{ marginTop: 4, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}
            accessibilityLabel="Read greeting aloud"
            accessibilityRole="button"
          >
            <Feather name="volume-2" size={scaleText(22)} color={currentTheme.colors.primary} />
            <Text style={{ color: currentTheme.colors.primary, fontSize: scaleText(14), fontWeight: '600', marginLeft: 6 }}>Hear Greeting</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>Today's Schedule</Text>
          {todayEntries.map((item) => {
            let caregiverPhoto = undefined;
            let caregiverName = undefined;
            if (item.assignedContact) {
              const caregiver = contacts.find(c => c.id === item.assignedContact);
              if (caregiver) {
                caregiverPhoto = caregiver.photo;
                caregiverName = caregiver.name;
              }
            }
            const steps = getStepsForItem(item);
            const reminderMsg = buildReminderMessage(item);
            return (
              <View key={item.id} style={{ marginBottom: scaleText(16) }}>
                <ScheduleCard
                  title={item.activityName}
                  time={item.time}
                  image={''}
                  completed={false}
                  caregiverPhoto={caregiverPhoto}
                  caregiverName={caregiverName}
                  reminderMessage={reminderMsg}
                  hasSteps={!!steps}
                  onShowSteps={() => handleShowSteps(item)}
                />
                <TouchableOpacity
                  onPress={() => speak(reminderMsg)}
                  style={{ marginTop: 4, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }}
                  accessibilityLabel={`Hear reminder for ${item.activityName}`}
                  accessibilityRole="button"
                >
                  <Feather name="volume-2" size={scaleText(18)} color={currentTheme.colors.primary} />
                  <Text style={{ color: currentTheme.colors.primary, fontSize: scaleText(14), fontWeight: '600', marginLeft: 4 }}>Hear Reminder</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.memoryButton]}
            onPress={handlePlayMemory}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Feather name="music" size={scaleText(32)} color={currentTheme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: getCalmModeTextColor() }]}>Play Memory</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.recordButton]}
            onPress={handleRecordThought}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Feather name="mic" size={scaleText(32)} color={currentTheme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: getCalmModeTextColor() }]}>Record a Thought</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.calmButton]}
            onPress={handleCalmZone}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Feather name="cloud-snow" size={scaleText(32)} color={currentTheme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: getCalmModeTextColor() }]}>Calm Zone</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ height: scaleText(120) }} />
      </Animated.ScrollView>
      <Modal
        visible={stepsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setStepsModalVisible(false)}
        accessible
        accessibilityViewIsModal
      >
        <Pressable style={modalStyles.overlay} onPress={() => setStepsModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close steps modal">
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Step {currentStepIndex + 1} of {currentSteps.length}</Text>
            <Text style={modalStyles.stepText}>{currentSteps[currentStepIndex]?.text}</Text>
            {currentSteps[currentStepIndex]?.image ? (
              <Image source={{ uri: currentSteps[currentStepIndex].image }} style={modalStyles.stepImage} accessibilityLabel="Step image" />
            ) : null}
            {currentSteps[currentStepIndex]?.audio ? (
              <TouchableOpacity style={modalStyles.audioButton} onPress={() => handleVoicePrompt(currentSteps[currentStepIndex].audio)} accessibilityLabel="Play step audio" accessibilityRole="button">
                <Feather name="volume-2" size={28} color="#fff" />
                <Text style={modalStyles.audioButtonText}>Play Audio</Text>
              </TouchableOpacity>
            ) : null}
            <View style={modalStyles.navRow}>
              <TouchableOpacity
                style={[modalStyles.navButton, currentStepIndex === 0 && { opacity: 0.5 }]}
                onPress={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                disabled={currentStepIndex === 0}
                accessibilityLabel="Back"
                accessibilityRole="button"
              >
                <Text style={modalStyles.navButtonText}>Back</Text>
              </TouchableOpacity>
              {currentStepIndex < currentSteps.length - 1 ? (
                <TouchableOpacity
                  style={modalStyles.navButton}
                  onPress={() => setCurrentStepIndex(i => Math.min(currentSteps.length - 1, i + 1))}
                  accessibilityLabel="Next"
                  accessibilityRole="button"
                >
                  <Text style={modalStyles.navButtonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={modalStyles.doneButton}
                  onPress={() => setStepsModalVisible(false)}
                  accessibilityLabel="Done"
                  accessibilityRole="button"
                >
                  <Text style={modalStyles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleText(220),
  },
  scheduleSection: {
    marginBottom: scaleText(40),
  },
  sectionTitle: {
    fontSize: scaleText(26),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(20),
    lineHeight: scaleText(32),
  },
  actionSection: {
    gap: scaleText(16),
    paddingHorizontal: scaleText(10),
  },
  actionButton: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    paddingVertical: scaleText(20),
    paddingHorizontal: scaleText(24),
    borderRadius: scaleText(20),
    minHeight: scaleText(80),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonContent: {
    flexDirection: currentTextScale.id === 'large' || currentTextScale.id === 'extra-large' ? 'row' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentTextScale.id === 'large' || currentTextScale.id === 'extra-large' ? scaleText(8) : scaleText(12),
    flexWrap: 'wrap',
  },
  memoryButton: {
    borderColor: theme.colors.primary,
  },
  recordButton: {
    borderColor: theme.colors.primary,
  },
  calmButton: {
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: scaleText(22),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: scaleText(28),
    flexShrink: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: scaleText(10),
    backgroundColor: calmMode ? 'rgba(0,0,0,0.85)' : theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: calmMode ? '#333' : theme.colors.border,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: scaleText(12),
    color: theme.colors.primary,
    marginTop: 2,
  },
  greeting: {
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scaleText(2),
  },
  greetingBanner: {
    backgroundColor: calmMode ? 'rgba(255,255,255,0.08)' : theme.colors.surface,
    borderRadius: scaleText(18),
    marginHorizontal: scaleText(16),
    marginTop: scaleText(12),
    marginBottom: scaleText(8),
    paddingVertical: scaleText(18),
    paddingHorizontal: scaleText(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderBanner: {
    backgroundColor: calmMode ? 'rgba(255,255,255,0.10)' : theme.colors.surface,
    borderRadius: scaleText(14),
    marginHorizontal: scaleText(8),
    marginTop: scaleText(8),
    marginBottom: scaleText(8),
    paddingVertical: scaleText(12),
    paddingHorizontal: scaleText(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    textAlign: 'center',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  card: {
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 22,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepImage: {
    width: 180,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 16,
    elevation: 2,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  navButton: {
    backgroundColor: '#9370DB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 8,
    elevation: 2,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 8,
    elevation: 2,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
}); 