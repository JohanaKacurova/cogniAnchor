import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import puzzlesData from '../../config/puzzles.json';
import { Brain, Sparkles, Palette, Star } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const ICONS: Record<string, any> = { Brain, Sparkles, Palette, Star };
const PUZZLES = (puzzlesData as any[]);

function renderPuzzleIcon(puzzle: any) {
  if (ICONS[puzzle.icon]) {
    return ICONS[puzzle.icon]({ size: 32, color: puzzle.iconColor, strokeWidth: 2 });
  }
  if (typeof puzzle.icon === 'string') {
    return <Text style={{ fontSize: 32 }}>{puzzle.icon}</Text>;
  }
  return <Text style={{ fontSize: 32 }}>❓</Text>;
}

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
              <View style={styles.icon}>{renderPuzzleIcon(puzzle)}</View>
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