import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useContacts } from '@/contexts/ContactsContext';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function ContactsScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const { contacts } = useContacts();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const params = useLocalSearchParams();
  const speedDialMode = params.speedDial === 'true';
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);

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

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'family':
        return '❤️';
      case 'medical':
        return '🏥';
      case 'emergency':
        return '🚨';
      case 'friends':
        return '👥';
      default:
        return '👤';
    }
  };

  const getContactInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = (contact: any) => {
    console.log(`Calling ${contact.name} at ${contact.phone}`);
    // In a real app, this would initiate a phone call
  };

  const handleAddContact = () => {
    try {
      router.push('/add-contact');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.replace('/add-contact');
    }
  };

  // For demo, pick first 4 family/friends as favorites
  const favoriteContacts = contacts.filter(c => c.category === 'family' || c.category === 'friends').slice(0, 4);
  const familyContacts = contacts.filter(c => c.category === 'family');

  // Play voice message logic
  const handlePlayMessage = async (contact: any) => {
    if (!contact.voiceMessage) return;
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingId(contact.id);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: contact.voiceMessage });
      setSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      setPlayingId(null);
      alert('Could not play the voice message.');
    }
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
        {speedDialMode ? (
          <View style={styles.speedDialSection}>
            <Text style={styles.speedDialTitle}>Family Speed Dial</Text>
            <View style={styles.speedDialGrid}>
              {familyContacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.speedDialButton}
                  onPress={() => handleCall(contact)}
                  activeOpacity={0.85}
                  accessibilityLabel={`Call ${contact.name}`}
                  accessibilityRole="button"
                >
                  {contact.photo ? (
                    <Image source={{ uri: contact.photo }} style={styles.speedDialPhoto} />
                  ) : (
                    <View style={styles.speedDialPhotoPlaceholder}>
                      <Text style={styles.speedDialInitials}>{getContactInitials(contact.name)}</Text>
                    </View>
                  )}
                  <Text style={styles.speedDialName}>{contact.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.addContactButton, { backgroundColor: currentTheme.colors.primary, marginTop: 24 }]} onPress={() => router.back()}>
              <Text style={styles.addContactEmoji}>⬅️</Text>
              <Text style={styles.addContactText}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Speed Dial Grid */}
            {favoriteContacts.length > 0 && (
              <View style={styles.speedDialSection}>
                <Text style={styles.speedDialTitle}>Quick Call</Text>
                <View style={styles.speedDialGrid}>
                  {favoriteContacts.map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.speedDialButton}
                      onPress={() => handleCall(contact)}
                      activeOpacity={0.85}
                      accessibilityLabel={`Call ${contact.name}`}
                      accessibilityRole="button"
                    >
                      {contact.photo ? (
                        <Image source={{ uri: contact.photo }} style={styles.speedDialPhoto} />
                      ) : (
                        <View style={styles.speedDialPhotoPlaceholder}>
                          <Text style={styles.speedDialInitials}>{getContactInitials(contact.name)}</Text>
                        </View>
                      )}
                      <Text style={styles.speedDialName}>{contact.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>Your Contacts</Text>
              <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>Tap anyone to call them</Text>
            </View>
            {/* Add Contact Button */}
            <TouchableOpacity 
              style={[styles.addContactButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleAddContact}
              activeOpacity={0.8}
            >
              <Text style={styles.addContactEmoji}>➕</Text>
              <Text style={styles.addContactText}>Add New Contact</Text>
            </TouchableOpacity>
            {/* Emergency Contact - Always at top */}
            {contacts.filter(contact => contact.category === 'emergency').map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactCard, styles.emergencyCard]}
                onPress={() => handleCall(contact)}
                activeOpacity={0.8}
              >
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyText}>EMERGENCY</Text>
                </View>
                <View style={styles.contactContent}>
                  <View style={styles.contactPhotoContainer}>
                    {contact.photo ? (
                      <Image source={{ uri: contact.photo }} style={styles.contactPhoto} />
                    ) : (
                      <View style={[styles.contactPhotoPlaceholder, styles.emergencyPhotoPlaceholder]}>
                        <Text style={[styles.contactInitials, styles.emergencyInitials]}>
                          {getContactInitials(contact.name)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, styles.emergencyName]}>{contact.name}</Text>
                    <Text style={[styles.contactPhone, styles.emergencyPhone]}>{contact.phone}</Text>
                    <Text style={[styles.contactDescription, styles.emergencyDescription]}>{contact.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {/* Family Contacts */}
            {contacts.filter(contact => contact.category === 'family').length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji('family')}</Text>
                  <Text style={[styles.categoryTitle, { color: getCalmModeTextColor() }]}>Family</Text>
                </View>
                {contacts.filter(contact => contact.category === 'family').map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCard}
                    onPress={() => handleCall(contact)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.contactContent}>
                      <View style={styles.contactPhotoContainer}>
                        {contact.photo ? (
                          <Image source={{ uri: contact.photo }} style={styles.contactPhoto} />
                        ) : (
                          <View style={[styles.contactPhotoPlaceholder, { backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1' }]}>
                            <Text style={[styles.contactInitials, { color: calmMode ? '#FF69B4' : '#FF69B4' }]}>
                              {getContactInitials(contact.name)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: getCalmModeTextColor() }]}>{contact.name}</Text>
                        <Text style={[styles.contactRelationship, { color: calmMode ? '#FF8FA3' : '#FF69B4' }]}>{contact.relationship}</Text>
                        <Text style={[styles.contactDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>{contact.description}</Text>
                        {/* Play Message Button */}
                        {contact.voiceMessage ? (
                          <TouchableOpacity
                            style={styles.playMessageButton}
                            onPress={() => handlePlayMessage(contact)}
                            activeOpacity={0.8}
                            accessibilityLabel={`Play message from ${contact.name}`}
                            accessibilityRole="button"
                            disabled={playingId === contact.id}
                          >
                            <Text style={styles.playMessageText}>{playingId === contact.id ? 'Playing...' : 'Play Message'}</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.playMessageButton, { backgroundColor: '#eee' }]}
                            accessibilityLabel={`No message from ${contact.name}`}
                            accessibilityRole="button"
                            accessible
                          >
                            <Text style={[styles.playMessageText, { color: '#aaa' }]}>Play Message</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Medical Contacts */}
            {contacts.filter(contact => contact.category === 'medical').length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji('medical')}</Text>
                  <Text style={[styles.categoryTitle, { color: getCalmModeTextColor() }]}>Medical Care</Text>
                </View>
                {contacts.filter(contact => contact.category === 'medical').map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCard}
                    onPress={() => handleCall(contact)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.contactContent}>
                      <View style={styles.contactPhotoContainer}>
                        {contact.photo ? (
                          <Image source={{ uri: contact.photo }} style={styles.contactPhoto} />
                        ) : (
                          <View style={[styles.contactPhotoPlaceholder, { backgroundColor: calmMode ? 'rgba(232, 245, 232, 0.3)' : '#E8F5E8' }]}>
                            <Text style={[styles.contactInitials, { color: calmMode ? '#50CD50' : '#32CD32' }]}>
                              {getContactInitials(contact.name)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: getCalmModeTextColor() }]}>{contact.name}</Text>
                        <Text style={[styles.contactRelationship, { color: calmMode ? '#50CD50' : '#32CD32' }]}>{contact.relationship}</Text>
                        <Text style={[styles.contactDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>{contact.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Friends Contacts */}
            {contacts.filter(contact => contact.category === 'friends').length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji('friends')}</Text>
                  <Text style={[styles.categoryTitle, { color: getCalmModeTextColor() }]}>Friends</Text>
                </View>
                {contacts.filter(contact => contact.category === 'friends').map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCard}
                    onPress={() => handleCall(contact)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.contactContent}>
                      <View style={styles.contactPhotoContainer}>
                        {contact.photo ? (
                          <Image source={{ uri: contact.photo }} style={styles.contactPhoto} />
                        ) : (
                          <View style={[styles.contactPhotoPlaceholder, { backgroundColor: calmMode ? 'rgba(230, 243, 255, 0.3)' : '#E6F3FF' }]}>
                            <Text style={[styles.contactInitials, { color: calmMode ? '#6BA2D4' : '#4682B4' }]}>
                              {getContactInitials(contact.name)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: getCalmModeTextColor() }]}>{contact.name}</Text>
                        <Text style={[styles.contactRelationship, { color: calmMode ? '#6BA2D4' : '#4682B4' }]}>{contact.relationship}</Text>
                        <Text style={[styles.contactDescription, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>{contact.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
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
    backgroundColor: calmMode ? 'rgba(255,255,255,0.5)' : 'transparent',
    zIndex: 1,
  },
  stickyHeader: {
    paddingTop: scaleText(16),
    paddingBottom: scaleText(8),
    paddingHorizontal: scaleText(24),
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeWrapper: {
    marginRight: scaleText(12),
  },
  time: {
    fontSize: scaleText(22),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  date: {
    fontSize: scaleText(16),
    fontWeight: '500',
    marginTop: scaleText(2),
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: scaleText(20),
    paddingBottom: scaleText(32),
    paddingTop: scaleText(8),
  },
  headerSection: {
    marginBottom: scaleText(18),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleText(26),
    fontWeight: 'bold',
    marginBottom: scaleText(2),
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: scaleText(15),
    fontWeight: '500',
    marginBottom: scaleText(8),
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: scaleText(12),
    paddingHorizontal: scaleText(24),
    borderRadius: scaleText(32),
    marginBottom: scaleText(18),
    marginTop: scaleText(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  addContactEmoji: {
    fontSize: scaleText(22),
    marginRight: scaleText(8),
  },
  addContactText: {
    fontSize: scaleText(17),
    fontWeight: '600',
    color: '#fff',
  },
  categorySection: {
    marginBottom: scaleText(24),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleText(8),
    marginTop: scaleText(8),
  },
  categoryEmoji: {
    fontSize: scaleText(22),
    marginRight: scaleText(8),
  },
  categoryTitle: {
    fontSize: scaleText(20),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  contactCard: {
    backgroundColor: calmMode ? 'rgba(255,255,255,0.7)' : '#fff',
    borderRadius: scaleText(18),
    padding: scaleText(16),
    marginBottom: scaleText(14),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  emergencyCard: {
    borderWidth: 2,
    borderColor: '#FF4C4C',
    backgroundColor: calmMode ? 'rgba(255,76,76,0.08)' : '#FFF5F5',
  },
  emergencyBadge: {
    position: 'absolute',
    top: -scaleText(12),
    left: scaleText(8),
    backgroundColor: '#FF4C4C',
    borderRadius: scaleText(8),
    paddingHorizontal: scaleText(8),
    paddingVertical: scaleText(2),
    zIndex: 3,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaleText(12),
    letterSpacing: 1,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactPhotoContainer: {
    marginRight: scaleText(14),
  },
  contactPhoto: {
    width: scaleText(48),
    height: scaleText(48),
    borderRadius: scaleText(24),
    resizeMode: 'cover',
  },
  contactPhotoPlaceholder: {
    width: scaleText(48),
    height: scaleText(48),
    borderRadius: scaleText(24),
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyPhotoPlaceholder: {
    backgroundColor: '#FFB3B3',
  },
  contactInitials: {
    fontSize: scaleText(20),
    fontWeight: 'bold',
    color: '#888',
  },
  emergencyInitials: {
    color: '#FF4C4C',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: scaleText(18),
    fontWeight: 'bold',
    marginBottom: scaleText(2),
  },
  emergencyName: {
    color: '#FF4C4C',
  },
  contactPhone: {
    fontSize: scaleText(15),
    color: '#FF4C4C',
    fontWeight: '600',
    marginBottom: scaleText(2),
  },
  emergencyPhone: {
    color: '#FF4C4C',
  },
  contactRelationship: {
    fontSize: scaleText(14),
    fontWeight: '600',
    marginBottom: scaleText(2),
  },
  contactDescription: {
    fontSize: scaleText(13),
    color: theme.colors.textSecondary,
  },
  emergencyDescription: {
    color: '#FF4C4C',
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
  speedDialSection: {
    marginBottom: scaleText(24),
  },
  speedDialTitle: {
    fontSize: scaleText(20),
    fontWeight: 'bold',
    marginBottom: scaleText(8),
  },
  speedDialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  speedDialButton: {
    width: '50%',
    padding: scaleText(12),
  },
  speedDialPhoto: {
    width: '100%',
    height: scaleText(120),
    borderRadius: scaleText(60),
    resizeMode: 'cover',
  },
  speedDialPhotoPlaceholder: {
    width: '100%',
    height: scaleText(120),
    borderRadius: scaleText(60),
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedDialInitials: {
    fontSize: scaleText(20),
    fontWeight: 'bold',
    color: '#888',
  },
  speedDialName: {
    fontSize: scaleText(16),
    fontWeight: 'bold',
    marginTop: scaleText(4),
  },
  playMessageButton: {
    backgroundColor: '#9370DB',
    borderRadius: scaleText(14),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    marginTop: scaleText(8),
    alignSelf: 'flex-start',
    elevation: 2,
  },
  playMessageText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scaleText(16),
  },
}); 