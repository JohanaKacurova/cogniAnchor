import React, { useState, useMemo } from 'react';
import { View, StyleSheet, AccessibilityProps, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import type { ShapeType } from './DraggableShape';

export interface DropZoneProps extends AccessibilityProps {
  expectedType: ShapeType;
  color?: string;
  size?: number;
  style?: any;
  onDrop?: (isCorrect: boolean) => void;
  accessibleLabel?: string;
  isActive?: boolean; // highlight when a shape is being dragged over
  showLabel?: boolean;
}

function renderOutline(type: ShapeType, color: string, size: number) {
  const borderStyle = {
    borderColor: color,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
  };
  switch (type) {
    case 'circle':
      return <View style={[{ width: size, height: size, borderRadius: size / 2 }, borderStyle, { alignItems: 'center', justifyContent: 'center' }]} />;
    case 'square':
      return <View style={[{ width: size, height: size, borderRadius: size * 0.15 }, borderStyle, { alignItems: 'center', justifyContent: 'center' }]} />;
    case 'triangle':
      return (
        <View
          style={{
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: size / 2,
              borderRightWidth: size / 2,
              borderBottomWidth: size - 4,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              backgroundColor: 'transparent',
              opacity: 0.15,
            }}
          />
        </View>
      );
    case 'heart':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.7, color, opacity: 0.2 }}>♥</Text>
        </View>
      );
    case 'star':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.7, color, opacity: 0.2 }}>★</Text>
        </View>
      );
    default:
      return null;
  }
}

const DropZone: React.FC<DropZoneProps> = React.memo(({
  expectedType,
  color,
  size = 64,
  style,
  onDrop,
  accessibleLabel,
  isActive = false,
  showLabel = false,
  ...accessibilityProps
}) => {
  const { currentTheme, scaleText, calmMode, getCalmModeStyles, getCalmModeSecondaryTextColor } = useTheme();
  const themeColor = color || currentTheme.colors.secondary;
  // Ensure sufficient contrast in Calm Mode
  const outlineColor = calmMode && (!color || color === '#F4A460' || color === '#DDA0DD') ? '#FFFFFF' : themeColor;
  const [dropped, setDropped] = useState<null | boolean>(null); // null = no drop, true = correct, false = incorrect
  const anim = useSharedValue(1);

  const outlineNode = useMemo(() => renderOutline(expectedType, outlineColor, scaleText(size)), [expectedType, outlineColor, size, scaleText]);

  // Animate scale and border color on drop
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: anim.value }],
    borderColor:
      dropped === true
        ? '#4CAF50'
        : dropped === false
        ? '#F44336'
        : themeColor,
    borderWidth: 2,
    borderStyle: 'dashed',
    ...(calmMode ? getCalmModeStyles() : {}),
  }));

  // Simulate drop event (to be connected to gesture logic in parent)
  const handleDrop = (shapeType: ShapeType) => {
    const isCorrect = shapeType === expectedType;
    setDropped(isCorrect);
    anim.value = withSpring(isCorrect ? 1.1 : 0.95, {}, () => {
      anim.value = withSpring(1);
    });
    if (onDrop) onDrop(isCorrect);
    setTimeout(() => setDropped(null), 800);
  };

  return (
    <Animated.View
      style={[
        styles.zone,
        { width: scaleText(size), height: scaleText(size) },
        animatedStyle,
        isActive && { backgroundColor: themeColor + '22' },
        style,
      ]}
      accessible
      accessibilityLabel={
        accessibleLabel || `Drop zone for ${color || themeColor} ${expectedType} shape`}
      accessibilityRole="button"
      {...accessibilityProps}
    >
      {outlineNode}
      {showLabel && (
        <Text style={{ color: calmMode ? getCalmModeSecondaryTextColor() : outlineColor, fontSize: scaleText(14), marginTop: 4, opacity: 0.7 }}>
          {expectedType.charAt(0).toUpperCase() + expectedType.slice(1)}
        </Text>
      )}
    </Animated.View>
  );
});

DropZone.displayName = 'DropZone';

const styles = StyleSheet.create({
  zone: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
});

export default DropZone; 