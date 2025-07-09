import React, { useRef, useMemo } from 'react';
import { View, AccessibilityProps, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useAnimatedGestureHandler } from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

// Shape rendering helpers
function renderShape(type: ShapeType, color: string, size: number) {
  switch (type) {
    case 'circle':
      return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
    case 'square':
      return <View style={{ width: size, height: size, borderRadius: size * 0.15, backgroundColor: color }} />;
    case 'triangle':
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomWidth: size,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
            backgroundColor: 'transparent',
          }}
        />
      );
    case 'heart':
      return (
        <View style={{ width: size, height: size }}>
          <View
            style={{
              position: 'absolute',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: color,
              left: size * 0.2,
              top: 0,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: color,
              left: 0,
              top: size * 0.2,
              transform: [{ rotate: '-45deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: color,
              left: size * 0.4,
              top: size * 0.2,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );
    case 'star':
      // Simple star using unicode, for accessibility and simplicity
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.Text style={{ fontSize: size * 0.9, color }}>{'★'}</Animated.Text>
        </View>
      );
    default:
      return null;
  }
}

export type ShapeType = 'circle' | 'square' | 'triangle' | 'heart' | 'star';

export interface DraggableShapeProps extends AccessibilityProps {
  type: ShapeType;
  color?: string;
  size?: number;
  style?: any;
  onDragEnd?: (position: { x: number; y: number }) => void;
  accessibleLabel?: string;
}

type ContextType = {
  startX: number;
  startY: number;
};

const DraggableShape: React.FC<DraggableShapeProps> = React.memo(({
  type,
  color,
  size = 64,
  style,
  onDragEnd,
  accessibleLabel,
  ...accessibilityProps
}) => {
  const { currentTheme, scaleText, calmMode, getCalmModeStyles } = useTheme();
  const themeColor = color || currentTheme.colors.primary;
  // Ensure sufficient contrast in Calm Mode
  const shapeColor = calmMode && (!color || color === '#F4A460' || color === '#DDA0DD') ? '#FFFFFF' : themeColor;
  const dragScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const shapeNode = useMemo(() => renderShape(type, shapeColor, scaleText(size)), [type, shapeColor, size, scaleText]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, ctx) => {
      dragScale.value = withSpring(1.1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ctx.startX = offsetX.value;
      ctx.startY = offsetY.value;
    },
    onActive: (event, ctx) => {
      offsetX.value = ctx.startX + event.translationX;
      offsetY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      dragScale.value = withSpring(1);
      if (onDragEnd) {
        onDragEnd({ x: offsetX.value, y: offsetY.value });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: dragScale.value },
    ],
    shadowColor: calmMode && shapeColor === '#FFFFFF' ? '#FFFFFF' : themeColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: dragScale.value > 1 ? 0.25 : 0.12,
    shadowRadius: dragScale.value > 1 ? 16 : 8,
    elevation: dragScale.value > 1 ? 12 : 4,
    ...(calmMode ? getCalmModeStyles() : {}),
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} shouldCancelWhenOutside={false} enabled>
      <Animated.View
        style={[styles.shapeContainer, animatedStyle, style]}
        accessible
        accessibilityLabel={
          accessibleLabel || `Draggable ${color || themeColor} ${type} shape`
        }
        accessibilityRole="image"
        {...accessibilityProps}
      >
        {shapeNode}
      </Animated.View>
    </PanGestureHandler>
  );
});

DraggableShape.displayName = 'DraggableShape';

const styles = StyleSheet.create({
  shapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    backgroundColor: 'transparent',
  },
});

export default DraggableShape; 