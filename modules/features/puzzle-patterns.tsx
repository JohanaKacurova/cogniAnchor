import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableShape, { ShapeType } from '../core/components/DraggableShape';
import DropZone from '../core/components/DropZone';
import PuzzleProgress from '../core/components/PuzzleProgress';
import { useTheme } from '../contexts/ThemeContext';
import { usePuzzle, PuzzleProvider, PuzzlePiece, PuzzleState } from '../contexts/PuzzleContext';
import { speak } from '../core/utils/tts';
import * as Haptics from 'expo-haptics';
import puzzlePatternsConfig from '../../config/puzzle-patterns.json';

// Example pattern: flower (center + 5 petals)
const PATTERN_SHAPES: { type: ShapeType; label: string; color: string }[] = puzzlePatternsConfig.patternShapes.map((shape: any) => ({
  ...shape,
  type: shape.type as ShapeType
}));

function getInitialPatternPieces(): PuzzlePiece[] {
  // All petals start as draggable, center is fixed
  return PATTERN_SHAPES.map((shape, i) => ({
    id: `pattern-${i}`,
    type: shape.type,
    position: { x: 0, y: 0 },
    correctPosition: { x: 0, y: 0 }, // Not used for this simple version
    matched: i === 0, // center is always matched
  }));
}

function getInitialPatternPuzzle(): PuzzleState {
  return {
    type: 'pattern-completion',
    pieces: getInitialPatternPieces(),
    completed: false,
    progress: 0,
    level: 1,
  };
}

const PatternPuzzleScreen: React.FC = () => {
  const { currentTheme, scaleText, calmMode, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const { puzzle, setPuzzle } = usePuzzle();
  const [matched, setMatched] = useState<{ [id: string]: boolean }>({ 'pattern-0': true });

  useEffect(() => {
    if (!puzzle) setPuzzle(getInitialPatternPuzzle());
  }, [puzzle, setPuzzle]);

  // All petals matched?
  const allMatched = PATTERN_SHAPES.every((_, i) => matched[`pattern-${i}`]);
  const progress = PATTERN_SHAPES.filter((_, i) => matched[`pattern-${i}`]).length / PATTERN_SHAPES.length;

  useEffect(() => {
    if (allMatched) {
      speak('Wonderful! You completed the flower pattern.');
      Alert.alert('Beautiful!', 'You completed the flower pattern!');
    }
  }, [allMatched]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}> 
      <Text style={[styles.title, { color: getCalmModeTextColor() }]}>Complete the Pattern</Text>
      <Text style={[styles.instructions, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>Drag each petal to its place around the center.</Text>
      <PuzzleProgress progress={progress} label="Pattern Progress" />
      <View style={styles.patternArea}>
        {/* Center */}
        <View style={[styles.center, { backgroundColor: PATTERN_SHAPES[0].color }]} />
        {/* Petal DropZones (arranged in a circle) */}
        {PATTERN_SHAPES.slice(1).map((shape, i) => {
          // Calculate angle for petal placement
          const angle = (i / 5) * 2 * Math.PI;
          const radius = 70;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <View
              key={shape.label}
              style={{ position: 'absolute', left: 100 + x, top: 100 + y }}
            >
              <DropZone
                expectedType={shape.type}
                color={shape.color}
                size={40}
                isActive={false}
                showLabel={false}
                accessibleLabel={`Drop zone for ${shape.label}`}
                onDrop={isCorrect => {
                  if (isCorrect) {
                    setMatched(prev => ({ ...prev, [`pattern-${i + 1}`]: true }));
                    speak('Beautiful! You placed a petal.');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } else {
                    speak('Try again. Place the petal in the correct spot.');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  }
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.shapesRow}>
        {PATTERN_SHAPES.slice(1).map((shape, i) =>
          !matched[`pattern-${i + 1}`] ? (
            <DraggableShape
              key={shape.label}
              type={shape.type}
              color={shape.color}
              size={40}
              accessibleLabel={`Draggable ${shape.label}`}
              onDragEnd={({ x, y }) => {
                // In a real app, use layout refs to check overlap
              }}
            />
          ) : (
            <View key={shape.label} style={{ width: 40, height: 40, margin: 8 }} />
          )
        )}
      </View>
      {allMatched && (
        <Text style={[styles.completion, { color: '#4CAF50' }]}>Pattern Complete!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: 320,
  },
  patternArea: {
    width: 220,
    height: 220,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    left: 100,
    top: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 2,
  },
  shapesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  completion: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
});

const PatternPuzzleWithProvider: React.FC = () => (
  <PuzzleProvider>
    <PatternPuzzleScreen />
  </PuzzleProvider>
);

export default PatternPuzzleWithProvider; 