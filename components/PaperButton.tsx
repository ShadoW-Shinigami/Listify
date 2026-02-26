import React from 'react';

interface PaperButtonProps {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  as?: React.ElementType;
}

const PaperButton: React.FC<PaperButtonProps> = ({ onClick, children, variant = 'primary', className = '', disabled, as: Component = 'button' }) => {
  const baseStyles = "px-4 py-2 rounded-sm border-2 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 typewriter-font font-bold shadow-md";
  
  const variants = {
    primary: "bg-white dark:bg-[#1a1a1a] border-[#4a4e69] dark:border-parchment-silver text-[#4a4e69] dark:text-parchment-silver hover:rotate-1",
    secondary: "bg-[#4a4e69] dark:bg-parchment-silver border-[#4a4e69] dark:border-parchment-silver text-white dark:text-[#1a1a1a] hover:-rotate-1",
    danger: "bg-white dark:bg-[#1a1a1a] border-red-700 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
    ghost: "border-transparent text-[#4a4e69] dark:text-parchment-silver hover:bg-black/5 dark:hover:bg-white/5"
  };

  return (
    <Component 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={Component === 'button' ? disabled : undefined}
    >
      {children}
    </Component>
  );
};

export default PaperButton;