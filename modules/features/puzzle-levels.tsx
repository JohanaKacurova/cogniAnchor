import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Sparkles, Palette, Star } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const PUZZLES = [
  {
    id: 'shape-matching-puzzle',
    title: 'Shape Matching',
    description: 'Drag and match shapes to their outlines.',
    icon: <Brain size={32} color="#4682B4" strokeWidth={2} />,
    route: '/shape-puzzle',
    levels: null,
  },
  {
    id: 'pattern-completion-puzzle',
    title: 'Pattern Completion',
    description: 'Complete soothing patterns with gentle shapes.',
    icon: <Sparkles size={32} color="#FFD700" strokeWidth={2} />,
    route: '/puzzle-patterns',
    levels: null,
  },
  {
    id: 'color-sorting-puzzle',
    title: 'Color Sorting',
    description: 'Sort shapes by color in a gentle gradient.',
    icon: <Palette size={32} color="#FF69B4" strokeWidth={2} />,
    route: '/puzzle-colors',
    levels: null,
  },
  {
    id: 'size-sequencing-puzzle',
    title: 'Size Sequencing',
    description: 'Arrange shapes from smallest to largest.',
    icon: <Brain size={32} color="#98FB98" strokeWidth={2} />,
    route: '/puzzle-sizes',
    levels: null,
  },
  {
    id: 'mind-match-game',
    title: 'Mind Match',
    description: 'Exercise your memory with friendly cards.',
    icon: <Star size={32} color="#9370DB" strokeWidth={2} />,
    route: '/mind-match',
    levels: [
      { id: '2x2', label: 'Gentle Start', description: '4 cards (2 pairs)' },
      { id: '2x3', label: 'Comfortable', description: '6 cards (3 pairs)' },
      { id: '3x4', label: 'Engaging', description: '12 cards (6 pairs)' },
    ],
  },
];

const PuzzleLevelsScreen: React.FC = () => {
  const { currentTheme, scaleText, calmMode, getCalmModeTextColor, getCalmModeSecondaryTextColor } = useTheme();
  const router = useRouter();
  const [selectingLevel, setSelectingLevel] = React.useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}> 
      <Text style={[styles.title, { color: getCalmModeTextColor() }]}>Choose a Puzzle</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {PUZZLES.map((puzzle) => (
          <View key={puzzle.id} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.card, calmMode && styles.cardCalm]}
              onPress={() => {
                if (puzzle.levels) {
                  setSelectingLevel(puzzle.id);
                } else {
                  router.push(puzzle.route as any);
                }
              }}
              activeOpacity={0.85}
              accessibilityLabel={`Select ${puzzle.title} puzzle`}
              accessibilityRole="button"
            >
              <View style={styles.icon}>{puzzle.icon}</View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: getCalmModeTextColor() }]}>{puzzle.title}</Text>
                <Text style={[styles.cardDescription, { color: calmMode ? getCalmModeSecondaryTextColor() : currentTheme.colors.textSecondary }]}>{puzzle.description}</Text>
              </View>
            </TouchableOpacity>
            {/* Level selection for Mind Match */}
            {selectingLevel === puzzle.id && puzzle.levels && (
              <View style={styles.levelsWrapper}>
                {puzzle.levels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={styles.levelCard}
                    onPress={() => {
                      // Pass level as query param if needed
                      router.push({ pathname: puzzle.route, params: { level: level.id } } as any);
                    }}
                    accessibilityLabel={`Select ${level.label} level`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.levelLabel}>{level.label}</Text>
                    <Text style={styles.levelDescription}>{level.description}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.levelCancel} onPress={() => setSelectingLevel(null)}>
                  <Text style={{ color: currentTheme.colors.error, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 16,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  cardWrapper: {
    width: '92%',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCalm: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.03,
  },
  icon: {
    marginRight: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 15,
    fontWeight: '400',
  },
  levelsWrapper: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    marginTop: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCard: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9370DB',
  },
  levelDescription: {
    fontSize: 14,
    color: '#888',
  },
  levelCancel: {
    marginTop: 10,
    alignItems: 'center',
  },
});

export default PuzzleLevelsScreen; 