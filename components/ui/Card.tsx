import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        glass-strong rounded-2xl p-6 md:p-8
        ${glow ? 'glow-border' : ''}
        ${className}
      `}
      style={{
        boxShadow: glow 
          ? '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)' 
          : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
