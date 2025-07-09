import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PuzzleType = 'shape-matching' | 'pattern-completion' | 'color-sorting' | 'size-sequencing' | 'symmetry';

export interface PuzzlePiece {
  id: string;
  type: string; // e.g., shape type or color
  position: { x: number; y: number };
  correctPosition: { x: number; y: number };
  matched?: boolean;
}

export interface PuzzleState {
  type: PuzzleType;
  pieces: PuzzlePiece[];
  completed: boolean;
  progress: number; // 0-1
  level: number;
}

interface PuzzleContextType {
  puzzle: PuzzleState | null;
  setPuzzle: (puzzle: PuzzleState) => void;
  updatePiecePosition: (id: string, position: { x: number; y: number }) => void;
  validatePuzzle: () => boolean;
  resetPuzzle: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

const PuzzleContext = createContext<PuzzleContextType | undefined>(undefined);

export const PUZZLE_STORAGE_KEY = 'calmzone_puzzle_progress';

export const PuzzleProvider = ({ children }: { children: ReactNode }) => {
  const [puzzle, setPuzzleState] = useState<PuzzleState | null>(null);

  const setPuzzle = useCallback((p: PuzzleState) => {
    setPuzzleState(p);
  }, []);

  const updatePiecePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setPuzzleState(prev => {
      if (!prev) return prev;
      const pieces = prev.pieces.map(piece =>
        piece.id === id ? { ...piece, position } : piece
      );
      return { ...prev, pieces };
    });
  }, []);

  const validatePuzzle = useCallback(() => {
    if (!puzzle) return false;
    const allMatched = puzzle.pieces.every(
      piece =>
        Math.abs(piece.position.x - piece.correctPosition.x) < 10 &&
        Math.abs(piece.position.y - piece.correctPosition.y) < 10
    );
    setPuzzleState(prev => prev ? { ...prev, completed: allMatched, progress: allMatched ? 1 : prev.progress } : prev);
    return allMatched;
  }, [puzzle]);

  const resetPuzzle = useCallback(() => {
    setPuzzleState(prev =>
      prev
        ? {
            ...prev,
            pieces: prev.pieces.map(piece => ({ ...piece, position: { x: 0, y: 0 }, matched: false })),
            completed: false,
            progress: 0,
          }
        : prev
    );
  }, []);

  const saveProgress = useCallback(async () => {
    if (puzzle) {
      await AsyncStorage.setItem(PUZZLE_STORAGE_KEY, JSON.stringify(puzzle));
    }
  }, [puzzle]);

  const loadProgress = useCallback(async () => {
    const data = await AsyncStorage.getItem(PUZZLE_STORAGE_KEY);
    if (data) {
      setPuzzleState(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return (
    <PuzzleContext.Provider
      value={{ puzzle, setPuzzle, updatePiecePosition, validatePuzzle, resetPuzzle, saveProgress, loadProgress }}
    >
      {children}
    </PuzzleContext.Provider>
  );
};

export function usePuzzle() {
  const context = useContext(PuzzleContext);
  if (!context) {
    throw new Error('usePuzzle must be used within a PuzzleProvider');
  }
  return context;
} 