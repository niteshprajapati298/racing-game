'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface GameControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export default function GameControls({ onMoveLeft, onMoveRight }: GameControlsProps) {
  const { isPlaying, isPaused, gameOver } = useGameStore();
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  // Handle continuous movement while button is pressed
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) {
      setLeftPressed(false);
      setRightPressed(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    if (leftPressed) {
      interval = setInterval(() => {
        onMoveLeft();
      }, 50); // Move every 50ms for smooth continuous movement
    } else if (rightPressed) {
      interval = setInterval(() => {
        onMoveRight();
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [leftPressed, rightPressed, isPlaying, isPaused, gameOver, onMoveLeft, onMoveRight]);

  if (!isPlaying || isPaused || gameOver) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 md:hidden">
      <div className="flex gap-8 items-center">
        {/* Left Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onTouchStart={(e) => {
            e.preventDefault();
            setLeftPressed(true);
            onMoveLeft();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setLeftPressed(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setLeftPressed(true);
            onMoveLeft();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            setLeftPressed(false);
          }}
          onMouseLeave={() => setLeftPressed(false)}
          className={`
            glass-strong rounded-full w-20 h-20 flex items-center justify-center 
            border-2 transition-all duration-200
            ${leftPressed 
              ? 'border-cyan-400 bg-cyan-500/30 shadow-lg shadow-cyan-500/50' 
              : 'border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-500/20'
            }
          `}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className={`text-cyan-400 ${leftPressed ? 'text-cyan-300' : ''}`}
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>

        {/* Center Indicator */}
        <div className="glass-strong rounded-lg px-4 py-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Controls</p>
        </div>

        {/* Right Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onTouchStart={(e) => {
            e.preventDefault();
            setRightPressed(true);
            onMoveRight();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setRightPressed(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setRightPressed(true);
            onMoveRight();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            setRightPressed(false);
          }}
          onMouseLeave={() => setRightPressed(false)}
          className={`
            glass-strong rounded-full w-20 h-20 flex items-center justify-center 
            border-2 transition-all duration-200
            ${rightPressed 
              ? 'border-cyan-400 bg-cyan-500/30 shadow-lg shadow-cyan-500/50' 
              : 'border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-500/20'
            }
          `}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className={`text-cyan-400 ${rightPressed ? 'text-cyan-300' : ''}`}
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
