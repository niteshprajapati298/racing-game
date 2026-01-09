import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
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
  const [colorHue, setColorHue] = useState(180);

  useEffect(() => {
    if (variant === 'primary') {
      const interval = setInterval(() => {
        setColorHue((prev) => (prev + 2) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [variant]);

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

  const baseClasses =
    'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed';
  
  const getVariantClasses = () => {
    if (variant === 'primary') {
      const color1 = hslToRgb(colorHue, 1, 0.5);
      const color2 = hslToRgb((colorHue + 60) % 360, 1, 0.5);
      return {
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        boxShadow: `0 0 20px ${color1}, 0 0 40px ${color2}`,
        color: '#ffffff',
      };
    } else if (variant === 'secondary') {
      return 'glass border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10';
    } else {
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 shadow-lg shadow-red-500/30';
    }
  };

  const variantStyle = variant === 'primary' ? getVariantClasses() : {};
  const variantClasses = variant !== 'primary' ? getVariantClasses() : '';

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      className={`${baseClasses} ${variant !== 'primary' ? variantClasses : ''} ${className}`}
      style={variant === 'primary' ? variantStyle : undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mr-2"
          >
            ⏳
          </motion.span>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
