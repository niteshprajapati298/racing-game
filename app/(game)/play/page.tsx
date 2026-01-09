'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import Button from '@/components/ui/Button';
import GameControls from '@/components/ui/GameControls';
import { REWARD_SCORE_THRESHOLD } from '@/lib/constants';

// Dynamic imports for performance
const GameCanvas = dynamic(() => import('./GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-cyan-400 text-xl animate-pulse">Loading game engine...</div>
    </div>
  ),
});

const HUD = dynamic(() => import('./HUD'), { ssr: false });

export default function PlayPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const moveLeftRef = useRef<() => void>();
  const moveRightRef = useRef<() => void>();
  
  const { 
    isPlaying, 
    isPaused, 
    gameOver, 
    score,
    setPlaying, 
    setPaused, 
    setGameOver, 
    reset 
  } = useGameStore();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // Handle keyboard for pause
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === ' ') && isPlaying && !gameOver) {
        e.preventDefault();
        setPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, gameOver, setPaused]);

  const handleStartGame = useCallback(() => {
    reset();
    setShowReward(false);
    setPlaying(true);
    setPaused(false);
    setGameOver(false);
  }, [reset, setPlaying, setPaused, setGameOver]);

  const handleGameOver = useCallback(async () => {
    setGameOver(true);
    setPlaying(false);

    const finalScore = useGameStore.getState().score;
    
    // Check for reward eligibility
    if (finalScore >= REWARD_SCORE_THRESHOLD) {
      setShowReward(true);
    }

    // Save score to backend
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const state = useGameStore.getState();
      await fetch('/api/score/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: state.score,
          distance: state.distance,
          time: state.time,
          speed: state.speed,
        }),
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  }, [setGameOver, setPlaying]);

  const handleRestart = useCallback(() => {
    reset();
    setShowReward(false);
    setPlaying(true);
    setPaused(false);
    setGameOver(false);
  }, [reset, setPlaying, setPaused, setGameOver]);

  const handleQuit = useCallback(() => {
    reset();
    router.push('/');
  }, [reset, router]);

  // Movement handlers for control buttons
  const handleMoveLeft = useCallback(() => {
    if (moveLeftRef.current) {
      moveLeftRef.current();
    } else if ((window as any).__gameMoveLeft) {
      (window as any).__gameMoveLeft();
    }
  }, []);

  const handleMoveRight = useCallback(() => {
    if (moveRightRef.current) {
      moveRightRef.current();
    } else if ((window as any).__gameMoveRight) {
      (window as any).__gameMoveRight();
    }
  }, []);

  // Store movement functions
  const setMoveLeft = useCallback((fn: () => void) => {
    moveLeftRef.current = fn;
  }, []);

  const setMoveRight = useCallback((fn: () => void) => {
    moveRightRef.current = fn;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="text-center">
          <div className="text-cyan-400 text-2xl mb-4 animate-pulse">Loading...</div>
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-black via-purple-900/10 to-black">
      {/* Game Canvas */}
      <GameCanvas 
        onGameOver={handleGameOver}
        onMoveLeft={setMoveLeft}
        onMoveRight={setMoveRight}
      />
      
      {/* HUD */}
      <HUD />

      {/* Control Buttons (Mobile) */}
      <GameControls 
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
      />

      {/* Start Screen */}
      <AnimatePresence>
        {!isPlaying && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl px-8 md:px-12 py-10 text-center max-w-md mx-4 glow-border"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6"
                style={{ 
                  textShadow: '0 0 40px #00ffff, 0 0 80px #00ffff, 0 0 120px #00ffff',
                  color: '#00ffff'
                }}
                animate={{ 
                  textShadow: [
                    '0 0 40px #00ffff, 0 0 80px #00ffff, 0 0 120px #00ffff',
                    '0 0 60px #00ffff, 0 0 100px #00ffff, 0 0 140px #00ffff',
                    '0 0 40px #00ffff, 0 0 80px #00ffff, 0 0 120px #00ffff',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                NEON RACER
              </motion.h1>
              <div className="space-y-4 mb-8">
                <p className="text-gray-300 text-sm md:text-base">
                  <span className="text-cyan-400 font-semibold">Desktop:</span> Arrow Keys or A/D to move
                </p>
                <p className="text-gray-300 text-sm md:text-base">
                  <span className="text-cyan-400 font-semibold">Mobile:</span> Use on-screen buttons
                </p>
                <p className="text-gray-300 text-sm md:text-base">
                  <span className="text-cyan-400 font-semibold">Pause:</span> ESC or SPACE
                </p>
                <p className="text-pink-400 font-semibold text-sm md:text-base mt-4">
                  ⚠️ Avoid enemy cars to survive!
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={handleStartGame} className="w-full text-lg py-4">
                  🏁 Start Race
                </Button>
                <Button onClick={handleQuit} variant="secondary" className="w-full">
                  ← Back to Menu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Actions */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-md mx-4"
            >
              {/* Reward notification */}
              {showReward && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mb-6 p-6 rounded-xl bg-gradient-to-r from-purple-500/40 to-pink-500/40 border-2 border-purple-500/70 backdrop-blur-sm"
                  style={{ boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
                >
                  <p className="text-purple-200 font-bold text-xl text-center">
                    🎉 Amazing! You're eligible for rewards! 🎉
                  </p>
                </motion.div>
              )}
              
              <div className="glass-strong rounded-2xl px-8 py-8 text-center space-y-4 glow-border">
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ 
                    textShadow: '0 0 30px #ff00ff, 0 0 60px #ff00ff',
                    color: '#ff00ff'
                  }}
                >
                  GAME OVER
                </h2>
                <div className="text-3xl md:text-4xl font-bold text-cyan-300 mb-6">
                  Score: {score.toLocaleString()}
                </div>
                <div className="space-y-3">
                  <Button onClick={handleRestart} className="w-full text-lg py-4">
                    🔄 Play Again
                  </Button>
                  <Button onClick={handleQuit} variant="secondary" className="w-full">
                    ← Main Menu
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
