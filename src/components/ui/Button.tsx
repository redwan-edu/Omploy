import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  onClick,
  className,
  disabled = false,
  type = 'button',
  icon,
}) => {
  const baseClasses = 'font-medium inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 p-0 focus:ring-0',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

  const buttonClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className
  );

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={buttonClasses}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {content}
      </motion.a>
    );
  }

  if (to) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
      >
        <Link to={to} className={buttonClasses} onClick={onClick}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.button>
  );
};