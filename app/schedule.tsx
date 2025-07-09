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
} from 'react-native';
import { Volume2, ChevronLeft, ChevronRight, Utensils, Pill, Tv, Users, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Feather } from '@expo/vector-icons';

export default function ScheduleScreen() {
  const { currentTheme, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const { getEntriesForDate, hasEntriesForDate } = useSchedule();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fadeAnim] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [selectedDate]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasEvents = (date: Date) => {
    const dateKey = formatDateKey(date);
    return hasEntriesForDate(dateKey);
  };

  const getSelectedDateEvents = () => {
    const dateKey = formatDateKey(selectedDate);
    return getEntriesForDate(dateKey);
  };

  const getIconComponent = (activityName: string) => {
    const iconSize = scaleText(24);
    const name = activityName.toLowerCase();
    if (name.includes('breakfast') || name.includes('meal') || name.includes('lunch') || name.includes('dinner')) {
      return <Utensils size={iconSize} color={currentTheme.colors.primary} strokeWidth={2} />;
    }
    if (name.includes('medication') || name.includes('medicine') || name.includes('pill')) {
      return <Pill size={iconSize} color={currentTheme.colors.primary} strokeWidth={2} />;
    }
    if (name.includes('movie') || name.includes('tv') || name.includes('watch')) {
      return <Tv size={iconSize} color={currentTheme.colors.primary} strokeWidth={2} />;
    }
    if (name.includes('walk') || name.includes('exercise')) {
      return <Users size={iconSize} color={currentTheme.colors.primary} strokeWidth={2} />;
    }
    return <Utensils size={iconSize} color={currentTheme.colors.primary} strokeWidth={2} />;
  };

  const handleVoicePrompt = (eventTitle: string) => {
    console.log(`Playing voice prompt for: ${eventTitle}`);
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDisplayTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAddEntry = () => {
    router.push({
      pathname: '/edit-schedule',
      params: { 
        selectedDate: selectedDate.toISOString(),
        mode: 'add'
      }
    });
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
            <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}</Text>
          </View>
          <Text style={[styles.date, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</Text>
        </View>
      </View>
      <ScrollView style={[styles.scrollView, { zIndex: 2 }]} showsVerticalScrollIndicator={false}>
        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
              activeOpacity={0.7}
            >
              <ChevronLeft size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: getCalmModeTextColor() }]}>{getMonthName(currentDate)}</Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
              activeOpacity={0.7}
            >
              <ChevronRight size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          {/* Days of Week Header */}
          <View style={styles.weekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekDay, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
                {day}
              </Text>
            ))}
          </View>
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentDate).map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  date && isToday(date) && styles.todayCell,
                  date && isSelected(date) && styles.selectedCell,
                ]}
                onPress={() => date && setSelectedDate(date)}
                activeOpacity={0.7}
                disabled={!date}
              >
                {date && (
                  <>
                    <Text
                      style={[
                        styles.dayText,
                        { color: getCalmModeTextColor() },
                        isToday(date) && styles.todayText,
                        isSelected(date) && styles.selectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {/* Event Indicator Dot */}
                    {hasEvents(date) && (
                      <View style={[
                        styles.eventDot,
                        {
                          backgroundColor: isSelected(date) || isToday(date) 
                            ? '#FFFFFF' 
                            : currentTheme.colors.primary
                        }
                      ]} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Schedule Section */}
        <Animated.View style={[styles.scheduleSection, { opacity: fadeAnim }]}> 
          <View style={styles.scheduleTitleContainer}>
            <Text style={[styles.scheduleTitle, { color: getCalmModeTextColor() }]}> 
              Schedule for {formatSelectedDate(selectedDate)}
            </Text>
            {/* Add Entry Button */}
            <TouchableOpacity 
              style={[styles.addEntryButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleAddEntry}
              activeOpacity={0.8}
            >
              <Plus size={scaleText(20)} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.addEntryText}>Add Entry</Text>
            </TouchableOpacity>
          </View>
          {getSelectedDateEvents().length > 0 ? (
            getSelectedDateEvents().map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventTime}>
                  <Text style={[styles.timeText, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
                    {formatDisplayTime(event.time)}
                  </Text>
                </View>
                <View style={styles.eventContent}>
                  <View style={styles.eventIcon}>
                    {getIconComponent(event.activityName)}
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventTitle, { color: getCalmModeTextColor() }]}>
                      {event.activityName}
                    </Text>
                    {event.description && (
                      <Text style={[styles.eventDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                        {event.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={() => handleVoicePrompt(event.activityName)}
                    activeOpacity={0.7}
                  >
                    <Volume2 size={scaleText(22)} color={currentTheme.colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Text style={[styles.noEventsText, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
                No events scheduled for this day
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
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
  },
  calendarSection: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    margin: scaleText(20),
    borderRadius: scaleText(20),
    padding: scaleText(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleText(20),
    minHeight: scaleText(50),
  },
  navButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  monthTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: scaleText(30),
    flex: 1,
    marginHorizontal: scaleText(10),
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: scaleText(10),
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: scaleText(16),
    fontWeight: '600',
    color: theme.colors.primary,
    paddingVertical: scaleText(8),
    lineHeight: scaleText(20),
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleText(8),
    marginVertical: scaleText(2),
    minHeight: scaleText(40),
    position: 'relative',
  },
  todayCell: {
    backgroundColor: theme.colors.accent,
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDot: {
    position: 'absolute',
    top: scaleText(26),
    left: '50%',
    transform: [{ translateX: -scaleText(3) }],
    width: scaleText(6),
    height: scaleText(6),
    borderRadius: scaleText(3),
    backgroundColor: theme.colors.primary,
  },
  scheduleSection: {
    paddingHorizontal: scaleText(20),
    paddingBottom: scaleText(30),
  },
  scheduleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleText(20),
    flexWrap: 'wrap',
    gap: scaleText(12),
  },
  scheduleTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(30),
    flex: 1,
    minWidth: scaleText(200),
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(12),
    gap: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: scaleText(50),
  },
  addEntryText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: scaleText(20),
  },
  eventCard: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(16),
    marginBottom: scaleText(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.04 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    minHeight: scaleText(120),
  },
  eventTime: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    paddingHorizontal: scaleText(12),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(12),
    alignSelf: 'flex-start',
    marginBottom: scaleText(12),
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  timeText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: theme.colors.primary,
    lineHeight: scaleText(20),
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleText(60),
  },
  eventIcon: {
    width: scaleText(60),
    height: scaleText(60),
    borderRadius: scaleText(12),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleText(16),
    borderWidth: 1,
    borderColor: theme.colors.accent,
    flexShrink: 0,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scaleText(10),
  },
  eventTitle: {
    fontSize: scaleText(20),
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: scaleText(26),
    flexWrap: 'wrap',
    marginBottom: scaleText(4),
  },
  eventDescription: {
    fontSize: scaleText(16),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    lineHeight: scaleText(20),
    flexWrap: 'wrap',
  },
  voiceButton: {
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
  noEventsContainer: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(16),
    padding: scaleText(40),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
  },
  noEventsText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(24),
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