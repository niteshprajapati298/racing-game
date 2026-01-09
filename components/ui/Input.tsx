import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          {label}
        </motion.label>
      )}
      <motion.input
        whileFocus={{ scale: 1.01 }}
        className={`
          w-full px-4 py-3 rounded-lg
          glass border border-cyan-500/30
          bg-black/30 text-white
          placeholder:text-gray-500
          focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50
          transition-all duration-300
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-400 flex items-center gap-1"
        >
          <span>⚠️</span>
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  );
}
