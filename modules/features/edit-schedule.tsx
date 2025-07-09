import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Save, Trash2, ChevronDown, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useSchedule, ScheduleEntry } from '@/contexts/ScheduleContext';

type TabRoute = '/(tabs)' | '/(tabs)/schedule' | '/(tabs)/contacts' | '/(tabs)/profile' | '/(tabs)/settings';

export default function EditScheduleScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const { contacts } = useContacts();
  const { addScheduleEntry, updateScheduleEntry, deleteScheduleEntry } = useSchedule();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;
  
  // Form state
  const [formData, setFormData] = useState<Omit<ScheduleEntry, 'id'>>({
    date: params.selectedDate ? new Date(params.selectedDate as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: '09:00',
    activityName: '',
    description: '',
    assignedContact: '',
    reminderType: 'both',
    repeatOption: 'none',
  });

  // UI state
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isEditMode = params.mode === 'edit';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
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

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDisplayTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatDisplayTime(timeString);
        times.push({ value: timeString, display: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleGoBack = () => {
    router.back();
  };

  const handleInputChange = (field: keyof Omit<ScheduleEntry, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.activityName.trim()) {
      newErrors.activityName = 'Please enter an activity name to save this entry';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      // Show error alert for empty activity name
      Alert.alert(
        'Missing Information',
        'Please enter an activity name before saving this entry.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Add the schedule entry
    addScheduleEntry(formData);
    
    // Navigate back to schedule screen immediately after saving
    router.push('/schedule');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this schedule entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting schedule entry');
            router.push('/schedule');
          }
        }
      ]
    );
  };

  const reminderOptions = [
    { id: 'voice', name: 'Voice Prompt', icon: '🔊' },
    { id: 'visual', name: 'Visual Alert', icon: '👁️' },
    { id: 'both', name: 'Both', icon: '🔔' },
  ];

  const repeatOptions = [
    { id: 'none', name: 'No Repeat', icon: '📅' },
    { id: 'daily', name: 'Daily', icon: '🔄' },
    { id: 'weekly', name: 'Weekly', icon: '📆' },
  ];

  const getSelectedContactName = () => {
    if (!formData.assignedContact) return 'None Selected';
    const contact = contacts.find(c => c.id === formData.assignedContact);
    return contact ? contact.name : 'None Selected';
  };

  const getSelectedReminderName = () => {
    const option = reminderOptions.find(r => r.id === formData.reminderType);
    return option ? option.name : 'Both';
  };

  const getSelectedRepeatName = () => {
    const option = repeatOptions.find(r => r.id === formData.repeatOption);
    return option ? option.name : 'No Repeat';
  };

  const handleTimeSelect = (timeValue: string) => {
    handleInputChange('time', timeValue);
    setShowTimePicker(false);
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
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>
            Add or Edit Schedule Entry
          </Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Plan your day with care
          </Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Picker */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>📆 Date</Text>
          <TouchableOpacity style={styles.dateTimeInput}>
            <Calendar size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
            <Text style={[styles.dateTimeText, { color: getCalmModeTextColor() }]}>
              {formatDisplayDate(formData.date)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>⏰ Time</Text>
          <TouchableOpacity 
            style={styles.dateTimeInput}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Clock size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
            <Text style={[styles.dateTimeText, { color: getCalmModeTextColor() }]}>
              {formatDisplayTime(formData.time)}
            </Text>
            <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          
          {showTimePicker && (
            <View style={styles.timePickerMenu}>
              <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={true}>
                {timeOptions.map((timeOption) => (
                  <TouchableOpacity 
                    key={timeOption.value}
                    style={styles.timePickerItem}
                    onPress={() => handleTimeSelect(timeOption.value)}
                  >
                    <Text style={[
                      styles.timePickerText, 
                      { color: getCalmModeTextColor() },
                      formData.time === timeOption.value && { color: currentTheme.colors.primary, fontWeight: '700' }
                    ]}>
                      {timeOption.display}
                    </Text>
                    {formData.time === timeOption.value && (
                      <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Activity Name */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>✍️ Activity Name</Text>
          <TextInput
            style={[
              styles.textInput, 
              { 
                color: getCalmModeTextColor(),
                backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface,
                borderColor: errors.activityName ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
              }
            ]}
            value={formData.activityName}
            onChangeText={(text) => handleInputChange('activityName', text)}
            placeholder="e.g., Take Morning Medication"
            placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
          />
          {errors.activityName ? (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.activityName}</Text>
          ) : null}
        </View>

        {/* Description */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>📄 Description (Optional)</Text>
          <TextInput
            style={[
              styles.textInput, 
              styles.multilineInput,
              { 
                color: getCalmModeTextColor(),
                backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface,
                borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border
              }
            ]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="e.g., With caregiver Sarah"
            placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Assigned Contact */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>👤 Assigned Contact (Optional)</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowContactDropdown(!showContactDropdown)}
          >
            <Text style={[styles.dropdownText, { color: getCalmModeTextColor() }]}>
              {getSelectedContactName()}
            </Text>
            <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          
          {showContactDropdown && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  handleInputChange('assignedContact', '');
                  setShowContactDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: getCalmModeTextColor() }]}>None</Text>
                {!formData.assignedContact && <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />}
              </TouchableOpacity>
              {contacts.map((contact) => (
                <TouchableOpacity 
                  key={contact.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('assignedContact', contact.id);
                    setShowContactDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: getCalmModeTextColor() }]}>
                    {contact.name} ({contact.relationship})
                  </Text>
                  {formData.assignedContact === contact.id && <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Reminder Type */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>🔔 Reminder Type</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowReminderDropdown(!showReminderDropdown)}
          >
            <Text style={[styles.dropdownText, { color: getCalmModeTextColor() }]}>
              {getSelectedReminderName()}
            </Text>
            <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          
          {showReminderDropdown && (
            <View style={styles.dropdownMenu}>
              {reminderOptions.map((option) => (
                <TouchableOpacity 
                  key={option.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('reminderType', option.id as any);
                    setShowReminderDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownEmoji}>{option.icon}</Text>
                    <Text style={[styles.dropdownItemText, { color: getCalmModeTextColor() }]}>
                      {option.name}
                    </Text>
                  </View>
                  {formData.reminderType === option.id && <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Repeat Option */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>🔁 Repeat Option</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowRepeatDropdown(!showRepeatDropdown)}
          >
            <Text style={[styles.dropdownText, { color: getCalmModeTextColor() }]}>
              {getSelectedRepeatName()}
            </Text>
            <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          
          {showRepeatDropdown && (
            <View style={styles.dropdownMenu}>
              {repeatOptions.map((option) => (
                <TouchableOpacity 
                  key={option.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('repeatOption', option.id as any);
                    setShowRepeatDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownEmoji}>{option.icon}</Text>
                    <Text style={[styles.dropdownItemText, { color: getCalmModeTextColor() }]}>
                      {option.name}
                    </Text>
                  </View>
                  {formData.repeatOption === option.id && <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Save size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>

          {isEditMode && (
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: '#FF4444' }]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
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
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(80),
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
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(30),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(20),
    marginTop: scaleText(2),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingTop: scaleText(20),
    paddingBottom: scaleText(40),
  },
  formSection: {
    marginBottom: scaleText(25),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  fieldLabel: {
    fontSize: scaleText(20),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(12),
    lineHeight: scaleText(26),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    gap: scaleText(12),
    minHeight: scaleText(70),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  dateTimeText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(24),
    flex: 1,
  },
  timePickerMenu: {
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.9)' : theme.colors.surface,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(12),
    marginTop: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.3 : 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: scaleText(300),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  timePickerScroll: {
    maxHeight: scaleText(300),
  },
  timePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(16),
    borderBottomWidth: 1,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    minHeight: scaleText(60),
  },
  timePickerText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(24),
    flex: 1,
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    minHeight: scaleText(70),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  multilineInput: {
    minHeight: scaleText(100),
    textAlignVertical: 'top',
    paddingTop: scaleText(18),
  },
  errorText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: '#FF4444',
    marginTop: scaleText(8),
    lineHeight: scaleText(20),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
    maxWidth: currentTextScale.id === 'extra-large' ? '90%' : '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    minHeight: scaleText(70),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  dropdownText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(24),
    flex: 1,
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  dropdownMenu: {
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.9)' : theme.colors.surface,
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(12),
    marginTop: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.3 : 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: scaleText(200),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(16),
    borderBottomWidth: 1,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    minHeight: scaleText(60),
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scaleText(12),
  },
  dropdownEmoji: {
    fontSize: scaleText(20),
    lineHeight: scaleText(24),
  },
  dropdownItemText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
    flex: 1,
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  actionSection: {
    gap: scaleText(16),
    marginTop: scaleText(20),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  saveButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(32),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(80),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  saveButtonText: {
    fontSize: scaleText(22),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(28),
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(32),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(80),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  deleteButtonText: {
    fontSize: scaleText(22),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(28),
    textAlign: 'center',
  },
});