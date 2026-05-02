import Link from 'next/link';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
  href?: string;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', href, children, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6B45] focus:ring-offset-2";
  const variants = {
    primary: "bg-[#1A6B45] text-white hover:bg-[#145336]",
    outline: "border-2 border-[#1A6B45] text-[#1A6B45] bg-transparent hover:bg-[#E8F5EE]",
    ghost: "text-[#1A6B45] bg-transparent hover:bg-[#E8F5EE]",
  };

  const combinedStyle = `${baseStyle} ${variants[variant]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={combinedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyle} {...props}>
      {children}
    </button>
  );
};
