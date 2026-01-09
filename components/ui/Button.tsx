import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-500 text-white glow-border hover:from-cyan-400 hover:to-blue-400',
    secondary:
      'glass border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:text-cyan-300',
    danger:
      'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <span className="animate-spin mr-2">⏳</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

