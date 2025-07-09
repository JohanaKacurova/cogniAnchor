import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableShape, { ShapeType } from '../core/components/DraggableShape';
import DropZone from '../core/components/DropZone';
import PuzzleProgress from '../core/components/PuzzleProgress';
import { useTheme } from '../contexts/ThemeContext';
import { usePuzzle, PuzzleProvider, PuzzlePiece, PuzzleState } from '../contexts/PuzzleContext';
import { speak } from '../core/utils/tts';
import * as Haptics from 'expo-haptics';

const COLORS = [
  '#FF69B4', // pink
  '#FFD700', // yellow
  '#87CEEB', // blue
  '#98FB98', // green
];

const SHAPE_TYPE: ShapeType = 'circle';

function getInitialColorPieces(): PuzzlePiece[] {
  return COLORS.map((color, i) => ({
    id: `color-${i}`,
    type: color,
    position: { x: 0, y: 0 },
    correctPosition: { x: 0, y: 0 },
    matched: false,
  }));
}

function getInitialColorPuzzle(): PuzzleState {
  return {
    type: 'color-sorting',
    pieces: getInitialColorPieces(),
    completed: false,
    progress: 0,
    level: 1,
  };
}

const ColorSortingPuzzleScreen: React.FC = () => {
  const { currentTheme, scaleText, calmMode, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const { puzzle, setPuzzle } = usePuzzle();
  const [matched, setMatched] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (!puzzle) setPuzzle(getInitialColorPuzzle());
  }, [puzzle, setPuzzle]);

  // All colors matched?
  const allMatched = COLORS.every((_, i) => matched[`color-${i}`]);
  const progress = COLORS.filter((_, i) => matched[`color-${i}`]).length / COLORS.length;

  useEffect(() => {
    if (allMatched) {
      speak('Wonderful! You sorted all the colors.');
      Alert.alert('Well done!', 'You sorted all the colors!');
    }
  }, [allMatched]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}> 
      <Text style={[styles.title, { color: getCalmModeTextColor() }]}>Sort the Colors</Text>
      <Text style={[styles.instructions, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>Drag each colored circle to its matching drop zone in the gradient.</Text>
      <PuzzleProgress progress={progress} label="Sorting Progress" />
      <View style={styles.zonesRow}>
        {COLORS.map((color, i) => (
          <DropZone
            key={color}
            expectedType={SHAPE_TYPE}
            color={color}
            size={48}
            isActive={false}
            showLabel={false}
            accessibleLabel={`Drop zone for ${color} circle`}
            onDrop={isCorrect => {
              if (isCorrect) {
                setMatched(prev => ({ ...prev, [`color-${i}`]: true }));
                speak('Great! You sorted the color.');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else {
                speak('Try again. Place the color in the correct spot.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }}
          />
        ))}
      </View>
      <View style={styles.shapesRow}>
        {COLORS.map((color, i) =>
          !matched[`color-${i}`] ? (
            <DraggableShape
              key={color}
              type={SHAPE_TYPE}
              color={color}
              size={48}
              accessibleLabel={`Draggable ${color} circle`}
              onDragEnd={({ x, y }) => {
                // In a real app, use layout refs to check overlap
              }}
            />
          ) : (
            <View key={color} style={{ width: 48, height: 48, margin: 8 }} />
          )
        )}
      </View>
      {allMatched && (
        <Text style={[styles.completion, { color: '#4CAF50' }]}>Sorting Complete!</Text>
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
  completion: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
});

const ColorSortingPuzzleWithProvider: React.FC = () => (
  <PuzzleProvider>
    <ColorSortingPuzzleScreen />
  </PuzzleProvider>
);

export default ColorSortingPuzzleWithProvider; 