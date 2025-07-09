import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableShape, { ShapeType } from '../core/components/DraggableShape';
import DropZone from '../core/components/DropZone';
import PuzzleProgress from '../core/components/PuzzleProgress';
import { useTheme } from '../contexts/ThemeContext';
import { usePuzzle, PuzzleProvider, PuzzlePiece, PuzzleState } from '../contexts/PuzzleContext';
import { speak } from '../core/utils/tts';
import * as Haptics from 'expo-haptics';
import puzzleSizesConfig from '../../config/puzzle-sizes.json';

const SIZES = puzzleSizesConfig.sizes;
const COLORS = puzzleSizesConfig.colors;
const SHAPE_TYPE = puzzleSizesConfig.shapeType as ShapeType;

function getInitialSizePieces(): PuzzlePiece[] {
  return SIZES.map((size, i) => ({
    id: `size-${i}`,
    type: String(size),
    position: { x: 0, y: 0 },
    correctPosition: { x: 0, y: 0 },
    matched: false,
  }));
}

function getInitialSizePuzzle(): PuzzleState {
  return {
    type: 'size-sequencing',
    pieces: getInitialSizePieces(),
    completed: false,
    progress: 0,
    level: 1,
  };
}

const SizeSequencingPuzzleScreen: React.FC = () => {
  const { currentTheme, scaleText, calmMode, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const { puzzle, setPuzzle } = usePuzzle();
  const [matched, setMatched] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (!puzzle) setPuzzle(getInitialSizePuzzle());
  }, [puzzle, setPuzzle]);

  // All sizes matched?
  const allMatched = SIZES.every((_, i) => matched[`size-${i}`]);
  const progress = SIZES.filter((_, i) => matched[`size-${i}`]).length / SIZES.length;

  useEffect(() => {
    if (allMatched) {
      speak('Wonderful! You sequenced all the sizes.');
      Alert.alert('Great job!', 'You sequenced all the sizes!');
    }
  }, [allMatched]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}> 
      <Text style={[styles.title, { color: getCalmModeTextColor() }]}>Sequence the Sizes</Text>
      <Text style={[styles.instructions, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>Drag each circle to its matching drop zone from smallest to largest.</Text>
      <PuzzleProgress progress={progress} label="Sequencing Progress" />
      <View style={styles.zonesRow}>
        {SIZES.map((size, i) => (
          <DropZone
            key={size}
            expectedType={SHAPE_TYPE}
            color={COLORS[i]}
            size={size}
            isActive={false}
            showLabel={false}
            accessibleLabel={`Drop zone for size ${size}`}
            onDrop={isCorrect => {
              if (isCorrect) {
                setMatched(prev => ({ ...prev, [`size-${i}`]: true }));
                speak('Nice! You placed the circle in the right spot.');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else {
                speak('Try again. Place the circle in the correct spot.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }}
          />
        ))}
      </View>
      <View style={styles.shapesRow}>
        {SIZES.map((size, i) =>
          !matched[`size-${i}`] ? (
            <DraggableShape
              key={size}
              type={SHAPE_TYPE}
              color={COLORS[i]}
              size={size}
              accessibleLabel={`Draggable circle size ${size}`}
              onDragEnd={({ x, y }) => {
                // In a real app, use layout refs to check overlap
              }}
            />
          ) : (
            <View key={size} style={{ width: size, height: size, margin: 8 }} />
          )
        )}
      </View>
      {allMatched && (
        <Text style={[styles.completion, { color: '#4CAF50' }]}>Sequencing Complete!</Text>
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

const SizeSequencingPuzzleWithProvider: React.FC = () => (
  <PuzzleProvider>
    <SizeSequencingPuzzleScreen />
  </PuzzleProvider>
);

export default SizeSequencingPuzzleWithProvider; 