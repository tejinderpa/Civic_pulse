'use client';

import Link from 'next/link';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  loading?: boolean;
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-2xl',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-md shadow-primary/15 focus:ring-primary',
  secondary:
    'bg-secondary-container text-on-secondary-container hover:opacity-90 focus:ring-secondary',
  outline:
    'border-2 border-primary text-primary bg-transparent hover:bg-primary/5 focus:ring-primary',
  ghost: 'text-primary bg-transparent hover:bg-primary/5 focus:ring-primary',
  danger:
    'bg-error text-on-error hover:bg-on-error-container focus:ring-error',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  children,
  loading,
  disabled,
  ...props
}) => {
  const combinedStyle = `inline-flex items-center justify-center gap-2 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${sizeStyles[size]} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyle} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};
