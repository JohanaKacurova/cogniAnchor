import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { 
  ArrowLeft,
  RotateCcw,
  Trophy,
  Heart,
  Star,
  Chrome as Home,
  Calendar,
  User,
  Settings,
  Phone,
  Volume2,
  Check,
  Lock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import mindMatchCards from '../../config/mind-match-cards.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Card {
  id: string;
  emoji: string;
  name: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardPairs = mindMatchCards;

// Replace the LEVELS array with a generated array of 50 levels:
const LEVELS = Array.from({ length: 50 }, (_, i) => {
  // Gradually increase pairs from 2 up to the max available, then repeat max
  const maxPairs = cardPairs.length;
  const pairs = Math.min(2 + Math.floor(i / 2), maxPairs);
  // Grid size logic: start with 2x2, then 2x3, 2x4, 3x4, 3x6, 4x5, 4x6, etc.
  let rows = 2, cols = 2;
  if (pairs <= 2) { rows = 2; cols = 2; }
  else if (pairs <= 3) { rows = 2; cols = 3; }
  else if (pairs <= 4) { rows = 2; cols = 4; }
  else if (pairs <= 6) { rows = 3; cols = 4; }
  else if (pairs <= 8) { rows = 4; cols = 4; }
  else if (pairs <= 10) { rows = 4; cols = 5; }
  else { rows = 4 + Math.floor((pairs - 10) / 3); cols = 6; }
  // Time limit decreases as levels increase, but not less than 15s
  const timeLimit = Math.max(60 - i, 15);
  // Difficulty flags
  const distractAnimations = i >= 10;
  const similarCards = i >= 20;
  const shuffleOnMiss = false; // Always false for Pexeso logic
  // Description
  const description = `Level ${i + 1}: ${pairs} pairs, ${rows}x${cols} grid${distractAnimations ? ', distractions' : ''}${similarCards ? ', similar cards' : ''}`;
  return { pairs, rows, cols, timeLimit, distractAnimations, similarCards, shuffleOnMiss, description };
});

type TabRoute = '/' | '/schedule' | '/contacts' | '/profile' | '/settings';

const WIN_OVERLAY_TEXT = {
  getTitle: (level: number) => `Level ${level + 1} Complete!`,
  getDescription: (attempts: number) => `You matched all cards in ${attempts} attempts!`,
  playAgain: 'Play Again',
  nextLevel: 'Next Level',
  allLevelsComplete: 'All Levels Complete',
};

export default function MindMatchScreen() {
  const { currentTheme, currentTextScale, calmMode, scaleText, getCalmModeStyles, getCalmModeTextColor } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [celebrationAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gridSize, setGridSize] = useState<'2x2' | '2x3' | '3x4'>('2x2');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showLevelIntro, setShowLevelIntro] = useState(false);
  const [levelTimer, setLevelTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 700;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted, currentLevel]);

  useEffect(() => {
    if (gameComplete) {
      // Celebration animation
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      // Play success sound (in a real app)
      console.log('Playing success sound');
      // Show completion overlay/modal instead of Alert
      setTimeout(() => setShowLevelComplete(true), 800);
    }
  }, [gameComplete]);

  // Load max unlocked level from storage
  useEffect(() => {
    AsyncStorage.getItem('mindMatchMaxLevel').then(val => {
      if (val !== null) setMaxUnlockedLevel(Number(val));
    });
  }, []);

  // Save max unlocked level on completion
  useEffect(() => {
    if (gameComplete && currentLevel > maxUnlockedLevel) {
      setMaxUnlockedLevel(currentLevel);
      AsyncStorage.setItem('mindMatchMaxLevel', String(currentLevel));
    }
  }, [gameComplete]);

  // Show level intro before each level
  useEffect(() => {
    if (gameStarted) {
      setShowLevelIntro(true);
      setTimeout(() => setShowLevelIntro(false), 2000); // Show intro for 2 seconds
    }
  }, [gameStarted, currentLevel]);

  // Time limit logic
  useEffect(() => {
    if (gameStarted && !showLevelIntro && !showLevelComplete) {
      const config = getGridConfig();
      if (config.timeLimit) {
        setTimeLeft(config.timeLimit);
        if (levelTimer) clearInterval(levelTimer);
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === 1) {
              clearInterval(timer);
              setGameComplete(true);
              setShowLevelComplete(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setLevelTimer(timer);
        return () => clearInterval(timer);
      }
    }
    // Cleanup
    return () => { if (levelTimer) clearInterval(levelTimer); };
  }, [gameStarted, showLevelIntro, currentLevel, showLevelComplete]);

  // --- PEXESO LOGIC REFACTOR ---
  // In handleCardPress:
  const handleCardPress = (cardId: string) => {
    if (flippedCards.length === 2) return; // Only allow two cards at a time
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip the selected card
    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    const newFlippedCards = [...flippedCards, cardId];
    setCards(newCards);
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);
      if (firstCard && secondCard && firstCard.name === secondCard.name) {
        // Match found
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
          setMatchedPairs(prev => {
            const newMatched = prev + 1;
            // Check for win immediately after updating matched pairs
            const config = getGridConfig();
            if (newMatched === config.pairs) {
              setGameComplete(true);
              setShowLevelComplete(true);
            }
            return newMatched;
          });
        }, 800);
      } else {
        // No match
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 1200);
      }
    }
  };

  const restartGame = () => {
    setGameStarted(false);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setGameComplete(false);
    setAttempts(0);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleTabPress = (route: TabRoute) => {
    router.push(route);
  };

  const handleDifficultySelect = (difficulty: '2x2' | '2x3' | '3x4') => {
    setGridSize(difficulty);
    setGameStarted(true);
  };

  const playVoiceEncouragement = () => {
    const encouragements = [
      "You're doing wonderfully!",
      "Great job using your memory!",
      "Keep going, you've got this!",
      "Your mind is working beautifully!",
      "Nice work! Try another pair."
    ];
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    console.log('Playing voice encouragement:', randomEncouragement);
  };

  // Next Level handler
  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setShowLevelComplete(false);
      setGameStarted(false);
      setGameComplete(false);
      setTimeout(() => setGameStarted(true), 100); // trigger new game
    }
  };
  // Play Again handler
  const handleReplayLevel = () => {
    setShowLevelComplete(false);
    setGameStarted(false);
    setGameComplete(false);
    setTimeout(() => setGameStarted(true), 100);
  };
  // Resume from last unlocked
  const handleResume = () => {
    setCurrentLevel(maxUnlockedLevel);
    setGameStarted(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Replace gridSize/gridConfig logic with LEVELS
  const getGridConfig = () => LEVELS[currentLevel] || LEVELS[LEVELS.length - 1];

  // Update initializeGame to use currentLevel
  const initializeGame = () => {
    const config = getGridConfig();
    const selectedPairs = cardPairs.slice(0, config.pairs);
    
    // Create pairs of cards
    const gameCards: Card[] = [];
    selectedPairs.forEach((pair, index) => {
      // First card of the pair
      gameCards.push({
        id: `${pair.name}-1`,
        emoji: pair.emoji,
        name: pair.name,
        color: pair.color,
        isFlipped: false,
        isMatched: false,
      });
      // Second card of the pair
      gameCards.push({
        id: `${pair.name}-2`,
        emoji: pair.emoji,
        name: pair.name,
        color: pair.color,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle once
    const shuffledCards = [...gameCards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setGameComplete(false);
    setAttempts(0);
  };

  const config = getGridConfig();
  const styles = createStyles(currentTheme, scaleText, calmMode, currentTextScale, config, width, height, isSmallScreen, isLargeScreen);

  return (
    <SafeAreaView style={[styles.container, getCalmModeStyles()]}>
      {calmMode && <View style={styles.calmOverlay} />}
      
      {/* Sticky Date/Time Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.time, { color: getCalmModeTextColor() }]}>{formatTime(currentTime)}</Text>
          </View>
          <Text style={[styles.date, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>{formatDate(currentTime)}</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={scaleText(24)} color={getCalmModeTextColor()} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: getCalmModeTextColor() }]}>🧠 Mind Match</Text>
          <Text style={[styles.headerSubtitle, { color: calmMode ? '#B0B0B0' : currentTheme.colors.primary }]}>
            Tap two cards to find matching pictures
          </Text>
        </View>

        {gameStarted && (
          <TouchableOpacity 
            style={styles.voiceButton}
            onPress={playVoiceEncouragement}
            activeOpacity={0.7}
          >
            <Volume2 size={scaleText(20)} color={currentTheme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}> 
        {showLevelIntro && (
          <View style={styles.levelIntroOverlay}>
            <View style={styles.levelIntroBox}>
              <Text style={styles.levelIntroTitle}>Level {currentLevel + 1}</Text>
              <Text style={styles.levelIntroDesc}>{getGridConfig().description}</Text>
              <Text style={styles.levelIntroDetails}>
                {getGridConfig().pairs * 2} cards, {getGridConfig().rows}x{getGridConfig().cols} grid
                {getGridConfig().timeLimit ? `, ${getGridConfig().timeLimit}s` : ''}
              </Text>
            </View>
          </View>
        )}
        {!gameStarted ? (
          // Level Select Grid
          <View style={styles.levelSelectScreen}>
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcomeTitle, { color: getCalmModeTextColor() }]}>Select a Level</Text>
              <Text style={[styles.welcomeText, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>Progress at your own pace. Completed levels are marked, locked levels are greyed out.</Text>
            </View>
            <View style={styles.levelGridWrapper}>
              <Animated.ScrollView contentContainerStyle={styles.levelGrid} horizontal={false} showsVerticalScrollIndicator={false}>
                {LEVELS.map((level, idx) => {
                  const isLocked = idx > maxUnlockedLevel;
                  const isCompleted = idx < maxUnlockedLevel;
                  const isCurrent = idx === maxUnlockedLevel;
                  return (
                    <Animated.View key={idx} style={[styles.levelCard, isLocked && styles.levelCardLocked, isCurrent && styles.levelCardCurrent]}> 
                      <TouchableOpacity
                        disabled={isLocked}
                        style={styles.levelCardTouchable}
                        onPress={() => {
                          setCurrentLevel(idx);
                          setGameStarted(true);
                        }}
                        activeOpacity={isLocked ? 1 : 0.8}
                      >
                        <View style={styles.levelIconWrapper}>
                          {isLocked ? (
                            <Lock size={32} color="#A9A9A9" strokeWidth={2} />
                          ) : isCompleted ? (
                            <Check size={32} color="#4CAF50" strokeWidth={2} />
                          ) : (
                            <Star size={32} color="#FFD700" strokeWidth={2} />
                          )}
                        </View>
                        <Text style={styles.levelNumber}>Level {idx + 1}</Text>
                        <Text style={styles.levelDetails}>{level.pairs * 2} cards ({level.pairs} pairs)</Text>
                        {isLocked && <Text style={styles.lockedText}>Locked</Text>}
                        {isCurrent && !isLocked && (
                          <Animated.View style={styles.levelUnlockAnim}>
                            <Text style={styles.levelUnlockText}>New!</Text>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            </View>
            {maxUnlockedLevel > 0 && (
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.8}>
                <Text style={styles.resumeText}>Resume from Level {maxUnlockedLevel + 1}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Game Screen
          <View style={styles.gameScreen}>
            {/* Game Stats */}
            <View style={styles.gameStats}>
              <View style={styles.statCard}>
                <Star size={scaleText(20)} color="#FFD700" strokeWidth={2} />
                <Text style={[styles.statText, { color: getCalmModeTextColor() }]}>
                  Pairs: {matchedPairs}/{config.pairs}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Heart size={scaleText(20)} color="#FF69B4" strokeWidth={2} />
                <Text style={[styles.statText, { color: getCalmModeTextColor() }]}>
                  Attempts: {attempts}
                </Text>
              </View>
            </View>

            {/* Game Grid */}
            <View style={[styles.gameGrid, { 
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              aspectRatio: config.cols / config.rows 
            }]}>
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.gameCard,
                    card.isFlipped && styles.gameCardFlipped,
                    card.isMatched && styles.gameCardMatched,
                    { backgroundColor: card.isFlipped || card.isMatched ? card.color : (calmMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.colors.surface) }
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  activeOpacity={0.8}
                  disabled={card.isFlipped || card.isMatched || flippedCards.length >= 2}
                >
                  {card.isFlipped || card.isMatched ? (
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  ) : (
                    <Text style={[styles.cardBack, { color: calmMode ? '#A0A0A0' : currentTheme.colors.primary }]}>?</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Game Controls */}
            <View style={styles.gameControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.restartButton]}
                onPress={restartGame}
                activeOpacity={0.8}
              >
                <RotateCcw size={scaleText(24)} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.controlButtonText}>New Game</Text>
              </TouchableOpacity>

              {gameComplete && (
                <Animated.View style={[
                  styles.completionBadge,
                  { transform: [{ scale: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }] }
                ]}>
                  <Trophy size={scaleText(32)} color="#FFD700" strokeWidth={2} />
                  <Text style={styles.completionText}>Wonderful!</Text>
                </Animated.View>
              )}
            </View>

            {/* Encouragement Message */}
            {!showLevelComplete && (
              <View style={styles.encouragementSection}>
                <Heart size={scaleText(20)} color="#FF69B4" strokeWidth={2} />
                <Text style={[styles.encouragementText, { color: calmMode ? '#B0B0B0' : currentTheme.colors.textSecondary }]}>
                  {flippedCards.length === 2 
                    ? "Take your time, you're doing great!"
                    : "Tap any card to start. You've got this!"
                  }
                </Text>
              </View>
            )}

            {/* Show timer if time limit is set */}
            {gameStarted && !showLevelIntro && !showLevelComplete && getGridConfig().timeLimit && (
              <View style={styles.timerBar}>
                <Text style={styles.timerText}>Time Left: {timeLeft}s</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/')}
          activeOpacity={0.7}
        >
          <Home 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            My Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/schedule')}
          activeOpacity={0.7}
        >
          <Calendar 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Schedule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/contacts')}
          activeOpacity={0.7}
        >
          <Phone 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Contacts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/profile')}
          activeOpacity={0.7}
        >
          <User 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabPress('/settings')}
          activeOpacity={0.7}
        >
          <Settings 
            size={scaleText(22)} 
            color={calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary} 
            strokeWidth={2} 
          />
          <Text style={[styles.navLabel, { color: calmMode ? '#A0A0A0' : currentTheme.colors.textSecondary }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Level Complete Overlay - always rendered last for stacking */}
      {showLevelComplete && (
        <View
          style={[
            styles.levelCompleteOverlay,
            {
              position: typeof window !== 'undefined' ? 'fixed' : 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              pointerEvents: 'auto',
              backgroundColor: 'rgba(0,255,0,0.5)',
              borderWidth: 5,
              borderColor: 'magenta',
            },
          ]}
        >
          <Text style={{ color: 'white', fontSize: 32, backgroundColor: 'red', borderWidth: 2, borderColor: 'yellow' }}>Level Complete!</Text>
          <View style={styles.levelCompleteBox}>
            <Trophy size={scaleText(40)} color="#FFD700" strokeWidth={2} />
            <Text style={styles.levelCompleteTitle}>{WIN_OVERLAY_TEXT.getTitle(currentLevel)}</Text>
            <Text style={styles.levelCompleteText}>{WIN_OVERLAY_TEXT.getDescription(attempts)}</Text>
            <View style={styles.levelCompleteButtons}>
              <TouchableOpacity style={styles.levelButton} onPress={handleReplayLevel} activeOpacity={0.8}>
                <Text style={styles.levelButtonText}>{WIN_OVERLAY_TEXT.playAgain}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.levelButton, currentLevel >= LEVELS.length - 1 && styles.levelButtonDisabled]}
                onPress={handleNextLevel}
                activeOpacity={currentLevel < LEVELS.length - 1 ? 0.8 : 1}
                disabled={currentLevel >= LEVELS.length - 1}
              >
                <Text style={styles.levelButtonText}>
                  {currentLevel < LEVELS.length - 1 ? WIN_OVERLAY_TEXT.nextLevel : WIN_OVERLAY_TEXT.allLevelsComplete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any, scaleText: (size: number) => number, calmMode: boolean, currentTextScale: any, config: any, width: number, height: number, isSmallScreen: boolean, isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    minHeight: scaleText(1600), // elongate the entire screen
    paddingBottom: scaleText(400), // add extra space at the bottom
  },
  calmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  stickyHeader: {
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.background,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingVertical: scaleText(12),
    borderBottomWidth: 0.5,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(80),
    gap: isSmallScreen ? scaleText(8) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: scaleText(8),
  },
  timeWrapper: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(8),
    borderRadius: scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.accent,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    minWidth: scaleText(80),
  },
  time: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  date: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: scaleText(16),
    flexShrink: 1,
  },
  header: {
    flexDirection: isSmallScreen ? 'column' : currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: isSmallScreen ? 'stretch' : currentTextScale.id === 'extra-large' ? 'stretch' : 'center',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.8)' : theme.colors.surface,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : 20,
    paddingVertical: scaleText(16),
    borderBottomWidth: 1,
    borderBottomColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
    minHeight: isSmallScreen ? scaleText(100) : currentTextScale.id === 'extra-large' ? scaleText(140) : scaleText(80),
    gap: isSmallScreen ? scaleText(8) : currentTextScale.id === 'extra-large' ? scaleText(12) : 0,
  },
  backButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: currentTextScale.id === 'extra-large' ? 0 : scaleText(16),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    alignSelf: currentTextScale.id === 'extra-large' ? 'flex-start' : 'auto',
  },
  headerContent: {
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
    justifyContent: 'center',
    alignItems: currentTextScale.id === 'extra-large' ? 'center' : 'flex-start',
  },
  headerTitle: {
    fontSize: scaleText(28),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleText(35),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
  },
  headerSubtitle: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
    marginTop: scaleText(4),
    textAlign: currentTextScale.id === 'extra-large' ? 'center' : 'left',
    maxWidth: currentTextScale.id === 'extra-large' ? '90%' : '100%',
  },
  voiceButton: {
    width: scaleText(44),
    height: scaleText(44),
    borderRadius: scaleText(22),
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignSelf: currentTextScale.id === 'extra-large' ? 'center' : 'auto',
  },
  mainContent: {
    flex: 1,
    zIndex: 2,
  },
  difficultyScreen: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : scaleText(20),
    paddingTop: scaleText(30),
    paddingBottom: scaleText(120),
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: scaleText(40),
    paddingHorizontal: scaleText(10),
  },
  welcomeTitle: {
    fontSize: scaleText(32),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scaleText(16),
    lineHeight: scaleText(40),
  },
  welcomeText: {
    fontSize: scaleText(20),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(28),
    maxWidth: '90%',
  },
  difficultyOptions: {
    gap: scaleText(20),
    alignItems: 'center',
  },
  difficultyCard: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
    borderRadius: scaleText(24),
    padding: isSmallScreen ? scaleText(12) : scaleText(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.08 : 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    minHeight: isSmallScreen ? scaleText(100) : scaleText(160),
    width: isLargeScreen ? '60%' : currentTextScale.id === 'extra-large' ? '90%' : '85%',
    maxWidth: scaleText(350),
  },
  easyCard: {
    borderColor: '#98FB98',
    backgroundColor: calmMode ? 'rgba(152, 251, 152, 0.2)' : '#F0FFF0',
  },
  mediumCard: {
    borderColor: '#87CEEB',
    backgroundColor: calmMode ? 'rgba(135, 206, 235, 0.2)' : '#F0F8FF',
  },
  challengeCard: {
    borderColor: '#DDA0DD',
    backgroundColor: calmMode ? 'rgba(221, 160, 221, 0.2)' : '#F8F0FF',
  },
  difficultyEmoji: {
    fontSize: scaleText(48),
    marginBottom: scaleText(12),
    lineHeight: scaleText(52),
  },
  difficultyTitle: {
    fontSize: scaleText(24),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scaleText(8),
    lineHeight: scaleText(30),
    textAlign: 'center',
  },
  difficultySubtitle: {
    fontSize: scaleText(18),
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: scaleText(8),
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  difficultyDescription: {
    fontSize: scaleText(16),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(22),
  },
  gameScreen: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 8 : isLargeScreen ? 40 : scaleText(20),
    paddingTop: scaleText(80), // even more space at the top
    paddingBottom: scaleText(400), // even more space at the bottom
    minHeight: scaleText(1400), // even longer game area
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleText(16),
    marginBottom: scaleText(24),
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderRadius: scaleText(16),
    paddingHorizontal: scaleText(16),
    paddingVertical: scaleText(12),
    gap: scaleText(8),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: calmMode ? 0.05 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statText: {
    fontSize: scaleText(16),
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: scaleText(20),
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: isSmallScreen ? scaleText(6) : scaleText(12),
    marginBottom: isSmallScreen ? scaleText(16) : scaleText(30),
    paddingHorizontal: isSmallScreen ? scaleText(4) : scaleText(10),
    minHeight: scaleText(900), // even longer grid area
  },
  gameCard: {
    width: isSmallScreen ? scaleText(60) : config.cols === 2 ? scaleText(120) : config.cols === 3 ? scaleText(100) : scaleText(80),
    height: isSmallScreen ? scaleText(60) : config.cols === 2 ? scaleText(120) : config.cols === 3 ? scaleText(100) : scaleText(80),
    borderRadius: scaleText(16),
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: calmMode ? 0.08 : 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
  },
  gameCardFlipped: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
  },
  gameCardMatched: {
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  cardEmoji: {
    fontSize: isSmallScreen ? scaleText(24) : config.cols === 2 ? scaleText(48) : config.cols === 3 ? scaleText(40) : scaleText(32),
    lineHeight: isSmallScreen ? scaleText(28) : config.cols === 2 ? scaleText(52) : config.cols === 3 ? scaleText(44) : scaleText(36),
  },
  cardBack: {
    fontSize: isSmallScreen ? scaleText(24) : config.cols === 2 ? scaleText(48) : config.cols === 3 ? scaleText(40) : scaleText(32),
    fontWeight: '700',
    color: theme.colors.primary,
    lineHeight: isSmallScreen ? scaleText(28) : config.cols === 2 ? scaleText(52) : config.cols === 3 ? scaleText(44) : scaleText(36),
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleText(20),
    marginBottom: scaleText(20),
  },
  controlButton: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(24),
    paddingVertical: scaleText(16),
    gap: scaleText(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: scaleText(70),
    minWidth: scaleText(140),
  },
  restartButton: {
    backgroundColor: '#9370DB',
  },
  controlButtonText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: scaleText(24),
    textAlign: 'center',
  },
  completionBadge: {
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: scaleText(20),
    paddingHorizontal: scaleText(20),
    paddingVertical: scaleText(16),
    gap: scaleText(8),
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completionText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#8B4513',
    lineHeight: scaleText(24),
  },
  encouragementSection: {
    flexDirection: currentTextScale.id === 'extra-large' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: calmMode ? 'rgba(255, 228, 225, 0.3)' : '#FFE4E1',
    borderRadius: scaleText(16),
    padding: scaleText(20),
    gap: scaleText(12),
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 105, 180, 0.3)' : '#FF69B4',
    marginTop: 'auto',
  },
  encouragementText: {
    fontSize: scaleText(16),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleText(22),
    flex: currentTextScale.id === 'extra-large' ? 0 : 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: calmMode ? 'rgba(0, 0, 0, 0.9)' : theme.colors.background,
    borderTopWidth: 0.5,
    borderTopColor: calmMode ? '#808080' : theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: calmMode ? 0.3 : 0.1,
    shadowRadius: 4,
    height: Math.max(85, scaleText(85)),
    paddingBottom: scaleText(15),
    paddingTop: scaleText(8),
    opacity: calmMode ? 0.95 : 1,
    zIndex: 1000,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleText(8),
    borderRadius: calmMode ? scaleText(12) : 0,
    marginHorizontal: calmMode ? scaleText(4) : 0,
    marginVertical: calmMode ? scaleText(4) : 0,
  },
  navLabel: {
    fontSize: scaleText(12),
    fontWeight: '600',
    marginTop: scaleText(4),
    lineHeight: scaleText(16),
    textAlign: 'center',
  },
  levelSelectScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: scaleText(20),
  },
  levelGridWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: scaleText(18),
    paddingBottom: scaleText(30),
  },
  levelCard: {
    width: scaleText(120),
    height: scaleText(150),
    backgroundColor: '#fff',
    borderRadius: scaleText(18),
    margin: scaleText(8),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  levelCardLocked: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  levelCardCurrent: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  levelCardTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  levelIconWrapper: {
    marginBottom: scaleText(10),
  },
  levelNumber: {
    fontSize: scaleText(20),
    fontWeight: '700',
    color: '#333',
    marginBottom: scaleText(4),
  },
  levelDetails: {
    fontSize: scaleText(14),
    color: '#888',
    marginBottom: scaleText(4),
  },
  levelUnlockAnim: {
    marginTop: scaleText(6),
    backgroundColor: '#FFD700',
    borderRadius: scaleText(8),
    paddingHorizontal: scaleText(10),
    paddingVertical: scaleText(2),
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  levelUnlockText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scaleText(14),
  },
  levelCompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    minHeight: '100%',
    minWidth: '100%',
    borderWidth: 5,
    borderColor: 'magenta',
  },
  levelCompleteBox: {
    backgroundColor: '#fff',
    borderRadius: scaleText(24),
    padding: scaleText(40),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: scaleText(400),
    borderWidth: 2, // debug border
    borderColor: 'blue', // debug border color
  },
  levelCompleteTitle: {
    fontSize: scaleText(36),
    fontWeight: '700',
    color: '#222', // ensure dark text
    marginTop: scaleText(20),
    marginBottom: scaleText(10),
    lineHeight: scaleText(44),
  },
  levelCompleteText: {
    fontSize: scaleText(18),
    fontWeight: '500',
    color: '#333', // ensure dark text
    marginBottom: scaleText(25),
    textAlign: 'center',
    lineHeight: scaleText(24),
  },
  levelCompleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: scaleText(15),
  },
  levelButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: scaleText(16),
    paddingVertical: scaleText(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  levelButtonText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#222', // ensure dark text
    lineHeight: scaleText(24),
    textAlign: 'center',
    width: '100%',
  },
  levelButtonDisabled: {
    backgroundColor: '#A9A9A9',
    borderColor: '#A9A9A9',
    opacity: 0.7,
  },
  lockedText: {
    fontSize: scaleText(14),
    fontWeight: '600',
    color: '#808080',
    marginTop: scaleText(10),
  },
  resumeButton: {
    backgroundColor: calmMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    borderRadius: scaleText(16),
    paddingVertical: scaleText(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: calmMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    marginTop: scaleText(20),
  },
  resumeText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: theme.colors.primary,
    lineHeight: scaleText(24),
  },
  levelIntroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  levelIntroBox: {
    backgroundColor: '#fff',
    borderRadius: scaleText(24),
    padding: scaleText(40),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  levelIntroTitle: {
    fontSize: scaleText(36),
    fontWeight: '700',
    color: '#333',
    marginBottom: scaleText(10),
  },
  levelIntroDesc: {
    fontSize: scaleText(22),
    fontWeight: '600',
    color: '#9370DB',
    marginBottom: scaleText(10),
  },
  levelIntroDetails: {
    fontSize: scaleText(16),
    color: '#888',
    textAlign: 'center',
  },
  timerBar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: scaleText(12),
    padding: scaleText(10),
    margin: scaleText(10),
  },
  timerText: {
    fontSize: scaleText(18),
    fontWeight: '700',
    color: '#333',
  },
});