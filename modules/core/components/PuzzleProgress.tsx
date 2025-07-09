import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface PuzzleProgressProps {
  progress: number; // 0 to 1
  label?: string;
  style?: ViewStyle;
}

const PuzzleProgress: React.FC<PuzzleProgressProps> = ({ progress, label, style }) => {
  const { currentTheme, scaleText, calmMode, getCalmModeStyles, getCalmModeSecondaryTextColor } = useTheme();
  const percent = Math.round(progress * 100);

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      {label && <Text style={[styles.label, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>{label}</Text>}
      <View style={[styles.barBackground, { backgroundColor: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.border }]}> 
        <View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor: calmMode ? '#87CEEB' : currentTheme.colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.percent, { color: calmMode ? '#E0E0E0' : currentTheme.colors.primary }]}>{percent}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    alignItems: 'center',
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  barBackground: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  percent: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default PuzzleProgress; 