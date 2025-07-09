import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableShape, { ShapeType } from '../core/components/DraggableShape';
import DropZone from '../core/components/DropZone';
import { useTheme } from '../contexts/ThemeContext';
import { usePuzzle, PuzzleProvider, PuzzlePiece, PuzzleState } from '../contexts/PuzzleContext';
import { speak } from '../core/utils/tts';
import * as Haptics from 'expo-haptics';
import puzzleShapesConfig from '../../config/puzzle-shapes.json';

const SHAPES = puzzleShapesConfig.shapes as ShapeType[];
const COLORS = puzzleShapesConfig.colors;

function getInitialPieces(): PuzzlePiece[] {
  // Randomize initial positions for draggable shapes
  return SHAPES.map((type, i) => ({
    id: `shape-${type}`,
    type,
    position: { x: 0, y: 0 },
    correctPosition: { x: 0, y: 0 }, // Not used for this simple version
    matched: false,
  }));
}

function getInitialPuzzle(): PuzzleState {
  return {
    type: 'shape-matching',
    pieces: getInitialPieces(),
    completed: false,
    progress: 0,
    level: 1,
  };
}

const ShapePuzzleScreen: React.FC = () => {
  const { currentTheme, scaleText, calmMode, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const { puzzle, setPuzzle, updatePiecePosition, validatePuzzle, resetPuzzle } = usePuzzle();

  useEffect(() => {
    if (!puzzle) setPuzzle(getInitialPuzzle());
  }, [puzzle, setPuzzle]);

  // Track which shapes have been matched
  const [matched, setMatched] = React.useState<{ [id: string]: boolean }>({});

  const handleDrop = (shapeType: ShapeType, zoneType: ShapeType) => {
    if (shapeType === zoneType) {
      setMatched(prev => ({ ...prev, [shapeType]: true }));
      speak("Great job! You matched the shape.");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Optionally update puzzle state for progress
    } else {
      speak("Try again. Drag the shape to the matching outline.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Try again', 'That shape does not match this outline.');
    }
  };

  // All matched?
  const allMatched = SHAPES.every(type => matched[type]);

  useEffect(() => {
    if (allMatched) {
      speak("Wonderful! You matched all the shapes.");
      Alert.alert('Great job!', 'You matched all the shapes!');
    }
  }, [allMatched]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}> 
      <Text style={[styles.title, { color: getCalmModeTextColor() }]}>Match the Shapes</Text>
      <Text style={[styles.instructions, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>Drag each shape to its matching outline.</Text>
      <View style={styles.zonesRow}>
        {SHAPES.map((type, i) => (
          <DropZone
            key={type}
            expectedType={type}
            color={COLORS[i]}
            size={64}
            isActive={false}
            showLabel
            accessibleLabel={`Drop zone for ${type}`}
            onDrop={isCorrect => {
              if (isCorrect) setMatched(prev => ({ ...prev, [type]: true }));
            }}
          />
        ))}
      </View>
      <View style={styles.shapesRow}>
        {SHAPES.map((type, i) =>
          !matched[type] ? (
            <DraggableShape
              key={type}
              type={type}
              color={COLORS[i]}
              size={64}
              accessibleLabel={`Draggable ${type} shape`}
              onDragEnd={({ x, y }) => {
                // For demo: if dropped near the drop zone, count as matched
                // In a real app, use layout refs to check overlap
              }}
            />
          ) : (
            <View key={type} style={{ width: 64, height: 64, margin: 8 }} />
          )
        )}
      </View>
      <Text style={[styles.progress, { color: currentTheme.colors.primary }]}>Matched: {Object.keys(matched).length} / {SHAPES.length}</Text>
      {allMatched && (
        <Text style={[styles.completion, { color: '#4CAF50' }]}>Puzzle Complete!</Text>
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
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  zonesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  shapesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  completion: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
});

// Wrap with PuzzleProvider for context
const ShapePuzzleWithProvider: React.FC = () => (
  <PuzzleProvider>
    <ShapePuzzleScreen />
  </PuzzleProvider>
);

export default ShapePuzzleWithProvider; 