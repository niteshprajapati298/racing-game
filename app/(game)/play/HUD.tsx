'use client';

import { memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const HUD = memo(() => {
  const { score, distance, speed, time, isPaused, isPlaying, gameOver } = useGameStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Only show HUD during gameplay
  if (!isPlaying && !gameOver) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top HUD */}
      <div className="p-4 md:p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          {/* Score - Main Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-xl px-5 md:px-7 py-3 md:py-4 glow-border"
          >
            <div className="text-cyan-400 text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
              Score
            </div>
            <motion.div 
              className="text-3xl md:text-5xl font-bold text-white"
              style={{ textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {score.toLocaleString()}
            </motion.div>
          </motion.div>

          {/* Stats Row */}
          <div className="flex gap-2 md:gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
            >
              <div className="text-cyan-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">
                Speed
              </div>
              <div className="text-xl md:text-3xl font-bold text-cyan-300">
                {Math.floor(speed * 20)} <span className="text-sm text-gray-400">km/h</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
            >
              <div className="text-cyan-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">
                Time
              </div>
              <div className="text-xl md:text-3xl font-bold text-cyan-300">
                {formatTime(time)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
            >
              <div className="text-cyan-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">
                Distance
              </div>
              <div className="text-xl md:text-3xl font-bold text-cyan-300">
                {Math.floor(distance)}<span className="text-sm text-gray-400">m</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="glass-strong rounded-2xl px-12 py-10 text-center glow-border"
            >
              <motion.h2 
                className="text-6xl font-bold mb-4"
                style={{ 
                  textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
                  color: '#00ffff'
                }}
                animate={{ 
                  opacity: [1, 0.7, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                PAUSED
              </motion.h2>
              <p className="text-gray-400 text-lg">Press ESC or SPACE to resume</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

HUD.displayName = 'HUD';

export default HUD;
