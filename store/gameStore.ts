import { create } from 'zustand';

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  distance: number;
  speed: number;
  time: number;
  gameOver: boolean;
  bestScore: number;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setScore: (score: number) => void;
  setDistance: (distance: number) => void;
  setSpeed: (speed: number) => void;
  setTime: (time: number) => void;
  setGameOver: (gameOver: boolean) => void;
  setBestScore: (score: number) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isPaused: false,
  score: 0,
  distance: 0,
  speed: 4,
  time: 0,
  gameOver: false,
  bestScore: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setScore: (score) => {
    const currentBest = get().bestScore;
    set({ 
      score,
      bestScore: score > currentBest ? score : currentBest 
    });
  },
  setDistance: (distance) => set({ distance }),
  setSpeed: (speed) => set({ speed }),
  setTime: (time) => set({ time }),
  setGameOver: (gameOver) => set({ gameOver }),
  setBestScore: (bestScore) => set({ bestScore }),
  reset: () => set({
    isPlaying: false,
    isPaused: false,
    score: 0,
    distance: 0,
    speed: 4,
    time: 0,
    gameOver: false,
  }),
}));
