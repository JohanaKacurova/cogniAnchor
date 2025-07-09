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
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ArrowLeft, Phone, Video, Mic, Check, User, Heart, Stethoscope, Users, Camera, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { usePhotoUpload } from '../core/hooks/usePhotoUpload';
import themeConfig from '../../config/theme.json';

interface ContactFormData {
  name: string;
  relationship: string;
  phone: string;
  videoCallEnabled: boolean;
  voiceMessage: string;
  photo?: string;
}

// Default theme fallback
const defaultTheme = themeConfig;

export default function AddContactScreen() {
  const { currentTheme = defaultTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const { addContact } = useContacts();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasVoiceMessage, setHasVoiceMessage] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const { uploadPhoto, isLoading: isPhotoUploading } = usePhotoUpload();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    relationship: '',
    phone: '',
    videoCallEnabled: false,
    voiceMessage: '',
    photo: undefined,
  });

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

  const handleGoBack = () => {
    router.push('/contacts');
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await uploadPhoto({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result) {
        setFormData(prev => ({ ...prev, photo: result.uri }));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: undefined }));
  };

  const handleVoiceUpload = () => {
    // In a real app, this would open voice recorder
    console.log('Opening voice recorder');
    setHasVoiceMessage(true);
    setFormData(prev => ({
      ...prev,
      voiceMessage: 'voice_message_recorded.mp3'
    }));
  };

  const determineCategory = (relationship: string): 'family' | 'medical' | 'emergency' | 'friends' => {
    const rel = relationship.toLowerCase();
    
    if (rel.includes('doctor') || rel.includes('nurse') || rel.includes('caregiver') || rel.includes('therapist') || rel.includes('care')) {
      return 'medical';
    }
    
    if (rel.includes('emergency') || rel.includes('911') || rel.includes('police') || rel.includes('fire')) {
      return 'emergency';
    }
    
    if (rel.includes('daughter') || rel.includes('son') || rel.includes('spouse') || rel.includes('husband') || 
        rel.includes('wife') || rel.includes('mother') || rel.includes('father') || rel.includes('parent') ||
        rel.includes('sibling') || rel.includes('brother') || rel.includes('sister') || rel.includes('grandchild') ||
        rel.includes('grandson') || rel.includes('granddaughter') || rel.includes('family')) {
      return 'family';
    }
    
    return 'friends';
  };

  const generateDescription = (name: string, relationship: string): string => {
    const category = determineCategory(relationship);
    
    switch (category) {
      case 'family':
        return `Your ${relationship.toLowerCase()} who loves you very much`;
      case 'medical':
        return `Your ${relationship.toLowerCase()} who helps take care of you`;
      case 'emergency':
        return 'For any emergency situation';
      case 'friends':
        return `Your ${relationship.toLowerCase()} who cares about you`;
      default:
        return `${name} - ${relationship}`;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a name for this contact';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter a phone number for this contact';
    }
    
    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Please enter the relationship for this contact';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveContact = () => {
    if (!validateForm()) {
      return;
    }
    
    const category = determineCategory(formData.relationship);
    const description = generateDescription(formData.name, formData.relationship);
    
    const newContact: Omit<Contact, 'id'> = {
      name: formData.name.trim(),
      relationship: formData.relationship.trim(),
      phone: formData.phone.trim(),
      category,
      description,
      videoCallEnabled: formData.videoCallEnabled,
      voiceMessage: formData.voiceMessage,
      photo: formData.photo,
    };
    
    addContact(newContact);
    
    // Navigate directly to contacts screen after successful save
    router.push('/contacts');
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.background }]}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={scaleText(24)} color={getCalmModeTextColor()} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Add New Contact</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Help them stay connected
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.headerTime, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Upload Section */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: getCalmModeTextColor() }]}>📷 Contact Photo</Text>
          <View style={styles.photoUploadSection}>
            {formData.photo ? (
              <View style={[styles.photoContainer, { backgroundColor: currentTheme.colors.border }]}>
                <Image source={{ uri: formData.photo }} style={[styles.uploadedPhoto, { borderColor: currentTheme.colors.primary }]} />
                <TouchableOpacity 
                  style={[styles.removePhotoButton, { backgroundColor: '#FF4444' }]}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.removePhotoText, { color: '#FFFFFF' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoUploadButton, { backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : currentTheme.colors.surface, opacity: isPhotoUploading ? 0.6 : 1 }]}
                onPress={handlePhotoUpload}
                activeOpacity={0.8}
                disabled={isPhotoUploading}
                accessibilityLabel="Add contact photo"
                accessibilityHint="Opens a dialog to choose a photo from camera or gallery"
                accessibilityRole="button"
                accessibilityState={{ busy: isPhotoUploading, disabled: isPhotoUploading }}
              >
                {isPhotoUploading ? (
                  <ActivityIndicator size="large" color={currentTheme.colors.primary} accessibilityLabel="Uploading photo" />
                ) : (
                  <>
                    <View style={styles.uploadIconContainer}>
                      <Camera size={scaleText(40)} color={currentTheme.colors.primary} strokeWidth={2} />
                      <Plus size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={3} style={styles.plusIcon} />
                    </View>
                    <Text style={[styles.uploadButtonText, { color: currentTheme.colors.primary }]}>Add Photo</Text>
                    <Text style={[styles.uploadButtonSubtext, { color: currentTheme.colors.textSecondary }]}>
                      {'Tap to upload from camera or gallery'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldLabelContainer}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>👤 Full Name</Text>
          </View>
          <TextInput
            style={[styles.textInput, { color: getCalmModeTextColor(), backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface, borderColor: errors.name ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border) }]}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter their full name"
            placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.name}</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldLabelContainer}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>❤️ Relationship</Text>
          </View>
          <Text style={[styles.fieldDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            How are they related to you? (e.g., Daughter, Doctor, Friend, etc.)
          </Text>
          <TextInput
            style={[styles.textInput, { color: getCalmModeTextColor(), backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface, borderColor: errors.relationship ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border) }]}
            value={formData.relationship}
            onChangeText={(text) => handleInputChange('relationship', text)}
            placeholder="Enter relationship (e.g., Daughter, Doctor, Friend)"
            placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
          />
          {errors.relationship && (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.relationship}</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldLabelContainer}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>📞 Phone Number</Text>
          </View>
          <TextInput
            style={[styles.textInput, { color: getCalmModeTextColor(), backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface, borderColor: errors.phone ? '#FF4444' : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border) }]}
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="Enter phone number"
            placeholderTextColor={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary}
            keyboardType="phone-pad"
          />
          {errors.phone && (
            <Text style={[styles.errorText, { color: '#FF4444' }]}>{errors.phone}</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldLabelContainer}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>🎥 Video Call Option</Text>
          </View>
          <Text style={[styles.fieldLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Enable video calling for this contact
          </Text>
          <Switch
            value={formData.videoCallEnabled}
            onValueChange={(value) => setFormData(prev => ({ ...prev, videoCallEnabled: value }))}
            trackColor={{ 
              false: calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border, 
              true: currentTheme.colors.primary
            }}
            thumbColor="#FFFFFF"
            style={[styles.switch, { transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }]}
          />
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldLabelContainer}>
            <Text style={[styles.fieldLabel, { color: getCalmModeTextColor() }]}>🔊 Voice Message (Optional)</Text>
          </View>
          <Text style={[styles.fieldDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Record a message from this person for comfort
          </Text>
          <TouchableOpacity 
            style={[styles.voiceButton, { backgroundColor: hasVoiceMessage ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface), borderColor: hasVoiceMessage ? currentTheme.colors.primary : (calmMode ? 'rgba(255, 255, 255, 0.2)' : currentTheme.colors.border) }]}
            onPress={handleVoiceUpload}
            activeOpacity={0.8}
          >
            {hasVoiceMessage ? (
              <>
                <Check size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                <Text style={[styles.voiceButtonTextSuccess, { color: '#FFFFFF' }]}>Voice Message Recorded</Text>
              </>
            ) : (
              <>
                <Mic size={scaleText(24)} color={calmMode ? '#A0A0A0' : currentTheme.colors.primary} strokeWidth={2} />
                <Text style={[styles.voiceButtonText, { color: calmMode ? '#A0A0A0' : currentTheme.colors.primary }]}>
                  Record Voice Message
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Show errors if validation fails */}
        {Object.keys(errors).length > 0 && (
          <View style={[styles.errorContainer, { backgroundColor: calmMode ? 'rgba(255, 68, 68, 0.2)' : '#FFE5E5' }]}>
            <Text style={[styles.errorTitle, { color: '#FF4444' }]}>Please fix the following:</Text>
            {Object.values(errors).map((error, index) => (
              <Text key={index} style={[styles.errorListItem, { color: '#FF4444' }]}>• {error}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={handleSaveContact}
          activeOpacity={0.8}
        >
          <Check size={scaleText(28)} color="#FFFFFF" strokeWidth={2} />
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save Contact</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  theme: any,
  scaleText: (size: number) => number,
  calmMode: boolean,
  currentTextScale: any,
  width: number,
  height: number,
  isSmallScreen: boolean,
  isLargeScreen: boolean
) => StyleSheet.create<{
  container: ViewStyle;
  calmOverlay: ViewStyle;
  stickyHeader: ViewStyle;
  dateTimeContainer: ViewStyle;
  timeWrapper: ViewStyle;
  time: TextStyle;
  date: TextStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerContent: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  timeContainer: ViewStyle;
  headerTime: TextStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  formSection: ViewStyle;
  sectionTitle: TextStyle;
  photoUploadSection: ViewStyle;
  photoUploadButton: ViewStyle;
  uploadIconContainer: ViewStyle;
  plusIcon: ViewStyle;
  uploadButtonText: TextStyle;
  uploadButtonSubtext: TextStyle;
  photoContainer: ViewStyle;
  uploadedPhoto: ImageStyle;
  removePhotoButton: ViewStyle;
  removePhotoText: TextStyle;
  fieldLabelContainer: ViewStyle;
  fieldLabel: TextStyle;
  fieldDescription: TextStyle;
  textInput: TextStyle;
  errorText: TextStyle;
  errorContainer: ViewStyle;
  errorTitle: TextStyle;
  errorListItem: TextStyle;
  toggleSection: ViewStyle;
  toggleInfo: ViewStyle;
  switch: ViewStyle;
  voiceButton: ViewStyle;
  voiceButtonText: TextStyle;
  voiceButtonTextSuccess: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
}>({
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
    minHeight: isSmallScreen ? scaleText(70) : scaleText(80),
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
    zIndex: 1000,
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
  timeContainer: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    paddingHorizontal: scaleText(12),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(12),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'auto',
  },
  headerTime: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingTop: scaleText(30),
    paddingBottom: scaleText(40),
  },
  formSection: {
    marginBottom: scaleText(30),
    alignItems: isSmallScreen ? 'stretch' : currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
    width: isLargeScreen ? '70%' : '100%',
    alignSelf: isLargeScreen ? 'center' : 'auto',
  },
  sectionTitle: {
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(20),
    lineHeight: scaleText(35),
  },
  photoUploadSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: isLargeScreen ? 400 : '100%',
    alignSelf: 'center',
  },
  photoUploadButton: {
    width: isSmallScreen ? scaleText(120) : currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
    height: isSmallScreen ? scaleText(120) : currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
    borderRadius: scaleText(20),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleText(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.1 : 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    position: 'absolute',
    top: scaleText(-8),
    right: scaleText(-8),
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.background,
    borderRadius: scaleText(10),
    padding: scaleText(2),
  },
  uploadButtonText: {
    fontSize: scaleText(20),
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: scaleText(26),
  },
  uploadButtonSubtext: {
    fontSize: scaleText(14),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(18),
    maxWidth: scaleText(140),
  },
  photoContainer: {
    position: 'relative',
    width: isSmallScreen ? scaleText(120) : currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
    height: isSmallScreen ? scaleText(120) : currentTextScale.id === 'extra-large' ? scaleText(200) : scaleText(180),
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: scaleText(20),
    backgroundColor: theme.colors.border,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  removePhotoButton: {
    position: 'absolute',
    top: scaleText(-8),
    right: scaleText(-8),
    width: scaleText(32),
    height: scaleText(32),
    borderRadius: scaleText(16),
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  removePhotoText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(20),
  },
  fieldLabelContainer: { marginBottom: scaleText(12), alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch' },
  fieldLabel: { fontSize: scaleText(22), fontWeight: '600', color: theme.colors.text, lineHeight: scaleText(28), textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left' },
  fieldDescription: {
    fontSize: scaleText(16),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    lineHeight: scaleText(22),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: isSmallScreen ? scaleText(10) : scaleText(20),
    paddingVertical: scaleText(18),
    fontSize: scaleText(20),
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
    textAlign: isSmallScreen ? 'left' : currentTextScale.id === 'extra-large' ? 'center' : 'left',
    width: isLargeScreen ? '80%' : currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: isLargeScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  errorText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: '#FF4444',
    lineHeight: scaleText(20),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  errorContainer: {
    backgroundColor: calmMode ? 'rgba(255, 68, 68, 0.2)' : '#FFE5E5',
    borderWidth: 2,
    borderColor: '#FF4444',
    borderRadius: scaleText(16),
    padding: scaleText(20),
    marginBottom: scaleText(20),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  errorTitle: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FF4444',
    marginBottom: scaleText(12),
    lineHeight: scaleText(24),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  errorListItem: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: '#FF4444',
    marginBottom: scaleText(4),
    lineHeight: scaleText(20),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  toggleSection: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'center',
    justifyContent: currentTextScale.id === 'extra-large' ? 'center' : 'space-between',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(18),
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(80),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: currentTextScale.id === 'extra-large' ? scaleText(16) : 0,
    width: currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  toggleInfo: {
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
    paddingRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  switch: {
    transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
  },
  voiceButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(24),
    paddingVertical: scaleText(20),
    gap: scaleText(12),
    minHeight: currentTextScale.id === 'extra-large' ? scaleText(100) : scaleText(80),
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
  voiceButtonText: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  voiceButtonTextSuccess: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: scaleText(20),
    paddingHorizontal: isSmallScreen ? scaleText(16) : scaleText(32),
    paddingVertical: isSmallScreen ? scaleText(16) : scaleText(24),
    gap: scaleText(16),
    marginTop: scaleText(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: isSmallScreen ? scaleText(70) : currentTextScale.id === 'extra-large' ? scaleText(120) : scaleText(90),
    width: isLargeScreen ? '60%' : currentTextScale.id === 'extra-large' ? '90%' : '100%',
    alignSelf: isLargeScreen ? 'center' : currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  saveButtonText: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(30),
    textAlign: 'center',
  },
});