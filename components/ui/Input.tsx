import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-cyan-400 mb-2">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg
          glass border border-cyan-500/30
          bg-black/20 text-white
          placeholder:text-gray-500
          focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50
          transition-all duration-300
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

