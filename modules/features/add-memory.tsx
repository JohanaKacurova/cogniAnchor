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
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { 
  ArrowLeft,
  Camera, 
  Video, 
  Mic, 
  Calendar, 
  Tag, 
  Users, 
  Save, 
  X, 
  Play,
  Pause,
  Upload,
  ChevronDown,
  Check,
  Chrome as Home,
  User,
  Settings,
  Phone
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useContacts } from '@/contexts/ContactsContext';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

interface MemoryFormData {
  title: string;
  date: string;
  category: string;
  description: string;
  mediaType: 'photo' | 'video' | null;
  mediaUri: string;
  voiceClipUri: string;
  taggedPeople: string[];
}

const categories = [
  { id: 'people', name: 'People', icon: '👥', color: '#FF69B4' },
  { id: 'places', name: 'Places', icon: '📍', color: '#32CD32' },
  { id: 'pets', name: 'Pets', icon: '🐾', color: '#FF8C00' },
  { id: 'life-events', name: 'Life Events', icon: '🎉', color: '#9370DB' },
  { id: 'hobbies', name: 'Hobbies', icon: '🎨', color: '#20B2AA' },
  { id: 'holidays', name: 'Holidays', icon: '🎄', color: '#DC143C' },
];

type TabRoute = '/' | '/schedule' | '/contacts' | '/profile' | '/settings';

export default function AddMemoryScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const { contacts } = useContacts();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const { uploadPhoto, isLoading: isPhotoUploading } = usePhotoUpload();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;

  const [formData, setFormData] = useState<MemoryFormData>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    mediaType: null,
    mediaUri: '',
    voiceClipUri: '',
    taggedPeople: [],
  });

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

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleTabPress = (route: TabRoute) => {
    router.push(route);
  };

  const handleInputChange = (field: keyof MemoryFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await uploadPhoto({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result) {
        setFormData(prev => ({
          ...prev,
          mediaType: 'photo',
          mediaUri: result.uri,
        }));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const handleMediaUpload = (type: 'photo' | 'video') => {
    // In a real app, this would open camera/gallery picker
    console.log(`Opening ${type} picker`);
    
    // Simulate media selection with sample images/videos
    const sampleMedia = {
      photo: [
        'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      video: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      ]
    };
    
    const randomMedia = sampleMedia[type][Math.floor(Math.random() * sampleMedia[type].length)];
    setFormData(prev => ({ 
      ...prev, 
      mediaType: type, 
      mediaUri: randomMedia 
    }));
  };

  const handleRemoveMedia = () => {
    setFormData(prev => ({ 
      ...prev, 
      mediaType: null, 
      mediaUri: '' 
    }));
  };

  const handleVoiceRecord = () => {
    if (Platform.OS === 'web') {
      // Web implementation would use Web Audio API
      console.log('Recording voice on web');
    } else {
      // Native implementation would use expo-av
      console.log('Recording voice on native');
    }
    
    setIsRecording(!isRecording);
    
    // Simulate recording completion
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setFormData(prev => ({ 
          ...prev, 
          voiceClipUri: 'voice_recording_' + Date.now() + '.mp3'
        }));
      }, 3000);
    }
  };

  const handlePlayVoice = () => {
    setIsPlayingVoice(!isPlayingVoice);
    console.log(`${isPlayingVoice ? 'Pausing' : 'Playing'} voice clip`);
    
    // Simulate playback completion
    if (!isPlayingVoice) {
      setTimeout(() => {
        setIsPlayingVoice(false);
      }, 5000);
    }
  };

  const handleRemoveVoice = () => {
    setFormData(prev => ({ ...prev, voiceClipUri: '' }));
    setIsPlayingVoice(false);
  };

  const handlePersonToggle = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      taggedPeople: prev.taggedPeople.includes(contactId)
        ? prev.taggedPeople.filter(id => id !== contactId)
        : [...prev.taggedPeople, contactId]
    }));
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(cat => cat.id === formData.category);
    return category ? `${category.icon} ${category.name}` : 'Select Category';
  };

  const getTaggedPeopleNames = () => {
    if (formData.taggedPeople.length === 0) return 'No one tagged';
    if (formData.taggedPeople.length === 1) {
      const contact = contacts.find(c => c.id === formData.taggedPeople[0]);
      return contact ? contact.name : 'Unknown';
    }
    return `${formData.taggedPeople.length} people tagged`;
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a title for this memory';
    }
    
    if (!formData.mediaUri && !formData.voiceClipUri) {
      newErrors.media = 'Please add at least a photo, video, or voice recording';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category for this memory';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveMemory = () => {
    if (!validateForm()) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required fields before saving this memory.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // In a real app, this would save to the backend
    console.log('Saving memory:', formData);
    
    Alert.alert(
      'Memory Saved!',
      'This beautiful memory has been added to Memory Lane.',
      [
        { 
          text: 'Add Another', 
          onPress: () => {
            // Reset form
            setFormData({
              title: '',
              date: new Date().toISOString().split('T')[0],
              category: '',
              description: '',
              mediaType: null,
              mediaUri: '',
              voiceClipUri: '',
              taggedPeople: [],
            });
            setErrors({});
          }
        },
        { 
          text: 'View Memory Lane', 
          onPress: () => {
            // @ts-ignore
            router.push('/memory-lane');
          }
        }
      ]
    );
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
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Add a New Memory</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Create a beautiful moment to cherish
          </Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Upload Section */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>📸 Upload Photo or Video</Text>
          
          {formData.mediaUri ? (
            <View style={styles.mediaPreviewContainer}>
              {formData.mediaType === 'photo' ? (
                <Image source={{ uri: formData.mediaUri }} style={styles.mediaPreview} />
              ) : (
                <View style={styles.videoPreview}>
                  <Video size={scaleText(60)} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.videoPreviewText}>Video Selected</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={handleRemoveMedia}
                activeOpacity={0.8}
              >
                <X size={scaleText(20)} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaUploadButtons}>
              <TouchableOpacity
                style={[styles.mediaButton, styles.photoButton, { opacity: isPhotoUploading ? 0.6 : 1 }]}
                onPress={handlePhotoUpload}
                activeOpacity={0.8}
                disabled={isPhotoUploading}
                accessibilityLabel="Upload memory photo"
                accessibilityHint="Opens a dialog to choose a photo from camera or gallery"
                accessibilityRole="button"
                accessibilityState={{ busy: isPhotoUploading, disabled: isPhotoUploading }}
              >
                {isPhotoUploading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" accessibilityLabel="Uploading photo" />
                ) : (
                  <>
                    <Camera size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.mediaButtonText}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, styles.videoButton]}
                onPress={() => handleMediaUpload('video')}
                activeOpacity={0.8}
              >
                <Video size={scaleText(32)} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.mediaButtonText}>Upload Video</Text>
              </TouchableOpacity>
            </View>
          )}
          {errors.media && (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.media}</Text>
          )}
        </View>

        {/* Voice Clip Section */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>��️ Add Voice Message (Optional)</Text>
          
          {formData.voiceClipUri ? (
            <View style={styles.voiceClipContainer}>
              <View style={styles.voiceClipInfo}>
                <Mic size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
                <Text style={[styles.voiceClipText, { color: getCalmModeTextColor() }]}>
                  Voice message recorded
                </Text>
              </View>
              <View style={styles.voiceClipActions}>
                <TouchableOpacity 
                  style={styles.voicePlayButton}
                  onPress={handlePlayVoice}
                  activeOpacity={0.8}
                >
                  {isPlayingVoice ? (
                    <Pause size={scaleText(20)} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <Play size={scaleText(20)} color="#FFFFFF" strokeWidth={2} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceRemoveButton}
                  onPress={handleRemoveVoice}
                  activeOpacity={0.8}
                >
                  <X size={scaleText(16)} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.voiceRecordButton,
                isRecording && styles.voiceRecordingActive
              ]}
              onPress={handleVoiceRecord}
              activeOpacity={0.8}
            >
              <Mic size={scaleText(28)} color={isRecording ? "#FF4444" : currentTheme.colors.primary} strokeWidth={2} />
              <Text style={[
                styles.voiceRecordText,
                { color: isRecording ? "#FF4444" : (calmMode ? '#A0A0A0' : currentTheme.colors.primary) }
              ]}>
                {isRecording ? 'Recording... Tap to stop' : 'Tap to Record Voice Message'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Memory Details Form */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>📝 Memory Details</Text>
          
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>Title *</Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  color: getCalmModeTextColor(),
                  backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface,
                  borderColor: errors.title ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border)
                }
              ]}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="e.g., Trip to the Lake"
              placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.title}</Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>Date (Optional)</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Calendar size={scaleText(24)} color={currentTheme.colors.primary} strokeWidth={2} />
              <Text style={[styles.dateText, { color: getCalmModeTextColor() }]}>
                {formatDisplayDate(formData.date)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>Category *</Text>
            <TouchableOpacity 
              style={[
                styles.dropdownButton,
                { borderColor: errors.category ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border) }
              ]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={[
                styles.dropdownText, 
                { color: formData.category ? getCalmModeTextColor() : (calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary) }
              ]}>
                {getSelectedCategoryName()}
              </Text>
              <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            
            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                {categories.map((category) => (
                  <TouchableOpacity 
                    key={category.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('category', category.id);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <View style={styles.categoryOption}>
                      <Text style={styles.categoryEmoji}>{category.icon}</Text>
                      <Text style={[styles.categoryName, { color: getCalmModeTextColor() }]}>
                        {category.name}
                      </Text>
                    </View>
                    {formData.category === category.id && (
                      <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.category && (
              <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.category}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>Description (Optional)</Text>
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
              placeholder="Tell the story behind this memory..."
              placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Person Tagging Section */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>👥 Who's in this Memory? (Optional)</Text>
          
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowPeopleDropdown(!showPeopleDropdown)}
          >
            <Text style={[styles.dropdownText, { color: getCalmModeTextColor() }]}>
              {getTaggedPeopleNames()}
            </Text>
            <ChevronDown size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          
          {showPeopleDropdown && (
            <View style={styles.dropdownMenu}>
              {contacts.filter(contact => contact.category === 'family' || contact.category === 'friends').map((contact) => (
                <TouchableOpacity 
                  key={contact.id}
                  style={styles.dropdownItem}
                  onPress={() => handlePersonToggle(contact.id)}
                >
                  <View style={styles.personOption}>
                    <Users size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
                    <Text style={[styles.personName, { color: getCalmModeTextColor() }]}>
                      {contact.name} ({contact.relationship})
                    </Text>
                  </View>
                  {formData.taggedPeople.includes(contact.id) && (
                    <Check size={scaleText(16)} color={currentTheme.colors.primary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={handleSaveMemory}
            activeOpacity={0.8}
          >
            <Save size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.saveButtonText}>Save Memory</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
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
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(35),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
    marginTop: scaleText(4),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
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
  formSection: {
    marginBottom: scaleText(30),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  sectionTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scaleText(20),
    lineHeight: scaleText(30),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  mediaUploadButtons: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    gap: scaleText(16),
    justifyContent: 'center',
    alignItems: 'center',
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  mediaButton: {
    flexDirection: isSmallScreen ? 'row' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(24),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: scaleText(80),
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
    minWidth: currentTextScale.id === 'extra-large' ? scaleText(200) : 'auto',
  },
  photoButton: {
    backgroundColor: '#9370DB',
  },
  videoButton: {
    backgroundColor: '#20B2AA',
  },
  mediaButtonText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  mediaPreviewContainer: {
    position: 'relative',
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  mediaPreview: {
    width: '100%',
    height: scaleText(200),
    borderRadius: scaleText(16),
    backgroundColor: theme.colors.border,
  },
  videoPreview: {
    width: '100%',
    height: scaleText(200),
    borderRadius: scaleText(16),
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleText(12),
  },
  videoPreviewText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: scaleText(24),
  },
  removeMediaButton: {
    position: 'absolute',
    top: scaleText(12),
    right: scaleText(12),
    width: scaleText(32),
    height: scaleText(32),
    borderRadius: scaleText(16),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRecordButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(24),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: scaleText(80),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  voiceRecordingActive: {
    borderColor: '#FF4444',
    backgroundColor: calmMode ? 'rgba(255, 68, 68, 0.1)' : '#FFE5E5',
  },
  voiceRecordText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  voiceClipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: scaleText(70),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  voiceClipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleText(12),
    flex: 1,
  },
  voiceClipText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: scaleText(22),
  },
  voiceClipActions: {
    flexDirection: 'row',
    gap: scaleText(8),
  },
  voicePlayButton: {
    width: scaleText(40),
    height: scaleText(40),
    borderRadius: scaleText(20),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRemoveButton: {
    width: scaleText(40),
    height: scaleText(40),
    borderRadius: scaleText(20),
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: scaleText(20),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  fieldLabel: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(12),
    lineHeight: scaleText(24),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    minHeight: scaleText(60),
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    gap: scaleText(12),
    minHeight: scaleText(60),
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
  dateText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
    flex: 1,
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
    minHeight: scaleText(60),
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
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleText(12),
    flex: 1,
  },
  categoryEmoji: {
    fontSize: scaleText(24),
    lineHeight: scaleText(28),
  },
  categoryName: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
    flex: 1,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleText(12),
    flex: 1,
  },
  personName: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: scaleText(22),
    flex: 1,
  },
  errorText: {
    fontSize: scaleText(14),
    fontWeight: '500',
    color: '#FF4444',
    marginTop: scaleText(8),
    lineHeight: scaleText(18),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
    maxWidth: currentTextScale.id === 'extra-large' ? '90%' : '100%',
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
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(16),
    paddingHorizontal: scaleText(24),
    minHeight: scaleText(60),
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  cancelButtonText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    lineHeight: scaleText(24),
    textAlign: 'center',
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