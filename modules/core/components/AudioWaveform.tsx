import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';

export interface AudioWaveformProps {
  isPlaying: boolean;
  progress: number; // 0-1
  duration: number;
  theme: any;
  scaleText: (size: number) => number;
  calmMode: boolean;
}

interface BarData {
  id: number;
  height: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = React.memo(function AudioWaveform({
  isPlaying,
  progress,
  duration,
  theme,
  scaleText,
  calmMode,
}: AudioWaveformProps) {
  const barCount = typeof 25 === 'number' && !isNaN(25) ? 25 : 20;
  const [bars, setBars] = useState<BarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Each bar gets its own shared value for animation
  const [barAnims] = useState(() => Array.from({ length: barCount }, () => useSharedValue(1)));

  // Debug logging
  console.log('AudioWaveform barCount:', barCount, 'bars:', bars);

  // Defensive: If barCount is invalid, do not render
  if (typeof barCount !== 'number' || isNaN(barCount) || barCount <= 0) {
    console.error('AudioWaveform: Invalid barCount', barCount);
    return null;
  }

  // Defensive: If bars is not an array, do not render
  if (!Array.isArray(bars)) {
    console.error('AudioWaveform: bars is not an array', bars);
    return null;
  }

  // Generate bars only once
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const generatedBars = Array.from({ length: barCount }, (_, i) => ({
        id: i,
        height: Math.random() * 0.7 + 0.3, // 0.3 to 1.0 (relative)
      }));
      setBars(generatedBars);
      setIsLoading(false);
    }, 0); // Defer to next tick for smoothness
  }, [barCount]);

  useEffect(() => {
    if (isPlaying) {
      // Start pulsing animation for each bar
      barAnims.forEach((anim, i) => {
        anim.value = withRepeat(
          withTiming(1.1 + Math.random() * 0.5, { duration: 350 + Math.random() * 250 }),
          -1,
          true
        );
      });
    } else {
      // Stop animation and reset
      barAnims.forEach((anim) => {
        cancelAnimation(anim);
        anim.value = 1;
      });
    }
    // Cleanup on unmount
    return () => {
      barAnims.forEach((anim) => cancelAnimation(anim));
    };
  }, [isPlaying, barAnims]);

  // Progress-based highlighting
  const progressIndex = Math.floor((progress || 0) * barCount);

  // Accessibility label
  const percent = Math.round((progress || 0) * 100);
  const accessibilityLabel = `Audio waveform, ${isPlaying ? 'playing' : 'paused'}, ${percent}% complete`;

  const renderBar = useCallback((bar: BarData, i: number) => {
    const animatedStyle = useAnimatedStyle(() => ({
      height: scaleText((12 + 24 * bar.height) * barAnims[i].value),
    }));
    // Highlight bars to the left of progress
    const isActive = i <= progressIndex;
    return (
      <Animated.View
        key={bar.id}
        style={[
          styles(scaleText, theme, calmMode).bar,
          animatedStyle,
          {
            backgroundColor: theme.colors.primary,
            opacity: calmMode
              ? isActive ? 0.7 : 0.3
              : isActive ? 1 : 0.3,
          },
        ]}
      />
    );
  }, [barAnims, scaleText, theme, calmMode, progressIndex]);

  if (isLoading) {
    return (
      <View style={styles(scaleText, theme, calmMode).container} accessibilityLabel={accessibilityLabel}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!bars || bars.length === 0) {
    return (
      <View style={styles(scaleText, theme, calmMode).container} accessibilityLabel={accessibilityLabel}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: scaleText(14) }}>No waveform data</Text>
      </View>
    );
  }

  return (
    <View style={styles(scaleText, theme, calmMode).container} accessibilityLabel={accessibilityLabel}>
      {bars.map(renderBar)}
    </View>
  );
});

const styles = (scaleText: (size: number) => number, theme: any, calmMode: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: scaleText(36),
    marginVertical: scaleText(8),
    backgroundColor: calmMode ? 'rgba(255,255,255,0.05)' : theme.colors.surface,
    borderRadius: scaleText(12),
    paddingHorizontal: scaleText(8),
    paddingVertical: scaleText(6),
  },
  bar: {
    width: scaleText(4),
    borderRadius: scaleText(2),
    marginHorizontal: scaleText(2),
    backgroundColor: theme.colors.primary,
  },
});

export default AudioWaveform; 