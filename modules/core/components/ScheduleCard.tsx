import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Volume2, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ScheduleCardProps {
  title: string;
  time: string;
  image: string;
  completed: boolean;
  onVoicePrompt: () => void;
  voicePromptUrl?: string;
  caregiverPhoto?: string;
  caregiverName?: string;
  reminderMessage?: string;
  hasSteps?: boolean;
  onShowSteps?: () => void;
}

export default function ScheduleCard({
  title,
  time,
  image,
  completed,
  onVoicePrompt,
  voicePromptUrl,
  caregiverPhoto,
  caregiverName,
  reminderMessage,
  hasSteps,
  onShowSteps,
}: ScheduleCardProps) {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeTextColor } = useTheme();
  
  const getActivityEmoji = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('breakfast') || titleLower.includes('meal') || titleLower.includes('lunch') || titleLower.includes('dinner')) {
      return '🍽️';
    }
    if (titleLower.includes('medication') || titleLower.includes('medicine') || titleLower.includes('pill')) {
      return '💊';
    }
    if (titleLower.includes('walk') || titleLower.includes('exercise')) {
      return '🚶';
    }
    if (titleLower.includes('movie') || titleLower.includes('tv') || titleLower.includes('watch')) {
      return '📺';
    }
    return '📅';
  };
  
  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale);

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <View style={styles.iconContainer}>
        <Text style={styles.activityEmoji}>{getActivityEmoji(title)}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={[
            styles.title, 
            { color: getCalmModeTextColor() },
            completed && styles.completedText
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.time, 
            { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary },
            completed && styles.completedText
          ]}>
            {time}
          </Text>
          {caregiverPhoto && (
            <View style={styles.caregiverRow}>
              <Image source={{ uri: caregiverPhoto }} style={styles.caregiverPhoto} />
              <Text style={styles.caregiverName}>{caregiverName}</Text>
            </View>
          )}
          {reminderMessage && (
            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>{reminderMessage}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionSection}>
          {completed && (
            <View style={styles.checkContainer}>
              <Check size={scaleText(28)} color="#4CAF50" strokeWidth={3} />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={onVoicePrompt}
            activeOpacity={0.7}
            accessibilityLabel={voicePromptUrl ? 'Play voice prompt' : 'No voice prompt available'}
            disabled={!voicePromptUrl}
          >
            <Volume2 size={scaleText(24)} color={voicePromptUrl ? currentTheme.colors.primary : '#B0B0B0'} strokeWidth={2} />
          </TouchableOpacity>
          
          {hasSteps && (
            <TouchableOpacity
              style={styles.showStepsButton}
              onPress={onShowSteps}
              accessibilityLabel="Show Steps"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.showStepsText}>Show Steps</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean, currentTextScale: any) => StyleSheet.create({
  card: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
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
    borderWidth: 2,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.accent,
    minHeight: scaleText(100),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'stretch',
  },
  completedCard: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.03)' : theme.colors.background,
    borderColor: '#4CAF50',
    opacity: 0.8,
  },
  iconContainer: {
    width: scaleText(80),
    height: scaleText(80),
    borderRadius: scaleText(12),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    flexShrink: 0,
    marginBottom: currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  activityEmoji: {
    fontSize: scaleText(40),
    lineHeight: scaleText(44),
  },
  content: {
    flex: 1,
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    marginLeft: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    minHeight: scaleText(80),
    gap: currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(10),
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  title: {
    fontSize: scaleText(24),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scaleText(4),
    lineHeight: scaleText(30),
    flexWrap: 'wrap',
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  time: {
    fontSize: scaleText(20),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(26),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  completedText: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  actionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleText(8),
    flexShrink: 0,
    minWidth: scaleText(60),
    flexDirection: currentTextScale.id === 'extra-large' ? 'row' : 'column',
  },
  checkContainer: {
    width: scaleText(36),
    height: scaleText(36),
    borderRadius: scaleText(18),
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: scaleText(48),
    height: scaleText(48),
    borderRadius: scaleText(24),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleText(6),
    gap: scaleText(8),
  },
  caregiverPhoto: {
    width: scaleText(32),
    height: scaleText(32),
    borderRadius: scaleText(16),
    marginRight: scaleText(6),
    borderWidth: 1,
    borderColor: '#B0B0B0',
  },
  caregiverName: {
    fontSize: scaleText(16),
    color: '#555',
    fontWeight: '500',
  },
  reminderBox: {
    backgroundColor: '#e3f0fa',
    borderRadius: scaleText(12),
    padding: scaleText(10),
    marginTop: scaleText(8),
    marginBottom: scaleText(4),
    alignSelf: 'stretch',
  },
  reminderText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: scaleText(16),
    textAlign: 'left',
  },
  showStepsButton: {
    backgroundColor: '#9370DB',
    borderRadius: scaleText(14),
    paddingHorizontal: scaleText(18),
    paddingVertical: scaleText(10),
    marginTop: scaleText(8),
    alignSelf: 'center',
    elevation: 2,
  },
  showStepsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scaleText(16),
  },
});