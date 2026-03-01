import React from 'react';

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#64748b', // Slate
  '#d946ef', // Fuchsia
];

export const getCategoryColor = (category: string) => {
  if (!category) return COLORS[10];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

interface TagProps {
  children: React.ReactNode;
  $color?: string;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, $color, className = '' }) => {
  const colorToUse = $color || (typeof children === 'string' ? getCategoryColor(children) : COLORS[10]);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all select-none ${className}`}
      style={{ 
        backgroundColor: `${colorToUse}15`,
        color: colorToUse,
      }}
    >
      {children}
    </span>
  );
};