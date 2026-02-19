'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  primary:
    'bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-white shadow-lg shadow-blue-900/30',
  secondary:
    'bg-[var(--card-bg)] hover:bg-[var(--bg-light)] text-[var(--text-primary)] border border-[var(--card-border)]',
  danger:
    'bg-[var(--button-danger)] hover:bg-red-700 text-white shadow-lg shadow-red-900/30',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-lg font-semibold transition-all duration-200
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
