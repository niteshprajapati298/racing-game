'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthForm from '@/components/forms/AuthForm';

export default function HomePage() {
  const router = useRouter();
  const [colorHue, setColorHue] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/play');
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorHue((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* RGB Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${hslToRgb(colorHue, 0.8, 0.3)}, transparent)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${hslToRgb((colorHue + 120) % 360, 0.8, 0.3)}, transparent)`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${hslToRgb((colorHue + 240) % 360, 0.8, 0.2)}, transparent)`,
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* RGB Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const particleHue = (colorHue + i * 12) % 360;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: hslToRgb(particleHue, 1, 0.6),
                boxShadow: `0 0 10px ${hslToRgb(particleHue, 1, 0.6)}`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 w-full px-4">
        {/* Header with RGB */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4"
            style={{
              color: hslToRgb(colorHue, 1, 0.8),
              textShadow: `0 0 40px ${hslToRgb(colorHue, 1, 0.6)}, 0 0 80px ${hslToRgb((colorHue + 60) % 360, 1, 0.6)}, 0 0 120px ${hslToRgb((colorHue + 120) % 360, 1, 0.6)}`,
            }}
            animate={{
              textShadow: [
                `0 0 40px ${hslToRgb(colorHue, 1, 0.6)}, 0 0 80px ${hslToRgb((colorHue + 60) % 360, 1, 0.6)}, 0 0 120px ${hslToRgb((colorHue + 120) % 360, 1, 0.6)}`,
                `0 0 60px ${hslToRgb((colorHue + 30) % 360, 1, 0.7)}, 0 0 100px ${hslToRgb((colorHue + 90) % 360, 1, 0.7)}, 0 0 140px ${hslToRgb((colorHue + 150) % 360, 1, 0.7)}`,
                `0 0 40px ${hslToRgb(colorHue, 1, 0.6)}, 0 0 80px ${hslToRgb((colorHue + 60) % 360, 1, 0.6)}, 0 0 120px ${hslToRgb((colorHue + 120) % 360, 1, 0.6)}`,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            NEON RACER
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300"
            style={{
              textShadow: `0 0 10px ${hslToRgb((colorHue + 180) % 360, 1, 0.5)}`,
            }}
          >
            High-Performance Futuristic Racing
          </motion.p>
        </motion.div>

        {/* Auth Form */}
        <AuthForm />
      </div>
    </div>
  );
}
