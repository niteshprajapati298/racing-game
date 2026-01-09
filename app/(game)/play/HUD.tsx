'use client';

import { memo, useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const HUD = memo(() => {
  const { score, distance, speed, time, isPaused, isPlaying, gameOver } = useGameStore();
  const [colorHue, setColorHue] = useState(0);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const interval = setInterval(() => {
      setColorHue((prev) => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hslToRgb = (h: number, s: number, l: number): string => {
    h = h % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
  };

  const getTextShadow = (hue: number) => {
    const color1 = hslToRgb(hue, 1, 0.5);
    const color2 = hslToRgb((hue + 60) % 360, 1, 0.5);
    const color3 = hslToRgb((hue + 120) % 360, 1, 0.5);
    return `0 0 10px ${color1}, 0 0 20px ${color2}, 0 0 30px ${color3}`;
  };

  // Only show HUD during gameplay
  if (!isPlaying && !gameOver) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top HUD */}
      <div className="p-4 md:p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          {/* Score - Main Display with RGB */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-xl px-5 md:px-7 py-3 md:py-4 glow-border"
            style={{
              borderColor: hslToRgb(colorHue, 1, 0.5),
            }}
          >
            <div 
              className="text-xs md:text-sm font-medium uppercase tracking-wider mb-1"
              style={{ color: hslToRgb((colorHue + 60) % 360, 1, 0.7) }}
            >
              Score
            </div>
            <motion.div 
              className="text-3xl md:text-5xl font-bold"
              style={{ 
                color: hslToRgb(colorHue, 1, 0.8),
                textShadow: getTextShadow(colorHue),
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {score.toLocaleString()}
            </motion.div>
          </motion.div>

          {/* Stats Row with RGB colors */}
          <div className="flex gap-2 md:gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
              style={{
                borderColor: hslToRgb((colorHue + 90) % 360, 1, 0.4),
              }}
            >
              <div 
                className="text-[10px] md:text-xs uppercase tracking-wider mb-1"
                style={{ color: hslToRgb((colorHue + 90) % 360, 1, 0.7) }}
              >
                Speed
              </div>
              <div 
                className="text-xl md:text-3xl font-bold"
                style={{ 
                  color: hslToRgb((colorHue + 90) % 360, 1, 0.8),
                  textShadow: `0 0 10px ${hslToRgb((colorHue + 90) % 360, 1, 0.5)}`,
                }}
              >
                {Math.floor(speed * 20)} <span className="text-sm opacity-70">km/h</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
              style={{
                borderColor: hslToRgb((colorHue + 180) % 360, 1, 0.4),
              }}
            >
              <div 
                className="text-[10px] md:text-xs uppercase tracking-wider mb-1"
                style={{ color: hslToRgb((colorHue + 180) % 360, 1, 0.7) }}
              >
                Time
              </div>
              <div 
                className="text-xl md:text-3xl font-bold"
                style={{ 
                  color: hslToRgb((colorHue + 180) % 360, 1, 0.8),
                  textShadow: `0 0 10px ${hslToRgb((colorHue + 180) % 360, 1, 0.5)}`,
                }}
              >
                {formatTime(time)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-lg px-4 md:px-5 py-2 md:py-3"
              style={{
                borderColor: hslToRgb((colorHue + 270) % 360, 1, 0.4),
              }}
            >
              <div 
                className="text-[10px] md:text-xs uppercase tracking-wider mb-1"
                style={{ color: hslToRgb((colorHue + 270) % 360, 1, 0.7) }}
              >
                Distance
              </div>
              <div 
                className="text-xl md:text-3xl font-bold"
                style={{ 
                  color: hslToRgb((colorHue + 270) % 360, 1, 0.8),
                  textShadow: `0 0 10px ${hslToRgb((colorHue + 270) % 360, 1, 0.5)}`,
                }}
              >
                {Math.floor(distance)}<span className="text-sm opacity-70">m</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pause Overlay with RGB */}
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
                  color: hslToRgb(colorHue, 1, 0.8),
                  textShadow: getTextShadow(colorHue),
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
