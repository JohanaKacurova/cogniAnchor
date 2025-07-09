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

export default function MyDayScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { name: patientName } = usePatient();
  const { getEntriesForDate } = useSchedule();
  const { contacts } = useContacts();
  const todayStr = currentTime.toISOString().slice(0, 10);
  const todayEntries = getEntriesForDate(todayStr);
  const [stepsModalVisible, setStepsModalVisible] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}> 
      {calmMode && <View style={styles.calmOverlay} />}
      <View style={styles.stickyHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.greeting, { color: getCalmModeTextColor(), fontSize: scaleText(28), fontWeight: '700', marginBottom: scaleText(2) }]}> 
              {getGreeting()}, {patientName}!
            </Text>
            <Text style={[styles.date, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary, fontSize: scaleText(18), fontWeight: '600' }]}> 
              Today is {formatDate(currentTime)}
            </Text>
          </View>
        </View>
      </View>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            return (
              <ScheduleCard
                key={item.id}
                title={item.activityName}
                time={item.time}
                image={''}
                completed={false}
                voicePromptUrl={item.voicePromptUrl}
                onVoicePrompt={() => handleVoicePrompt(item.voicePromptUrl, item.activityName)}
                caregiverPhoto={caregiverPhoto}
                caregiverName={caregiverName}
                reminderMessage={getReminderMessage(item)}
                hasSteps={!!steps}
                onShowSteps={() => handleShowSteps(item)}
              />
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