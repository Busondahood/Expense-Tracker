import React from 'react';

// iOS System Colors Palette
const COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#32ADE6', // Sky Blue
  '#007AFF', // Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#A2845E', // Brown
  '#8E8E93', // Gray
];

export const getCategoryColor = (category: string) => {
  if (!category) return COLORS[11];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

interface TagProps {
  children: React.ReactNode;
  $color?: string; // Using $ prefix to match styled-components convention from prompt
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, $color, className = '' }) => {
  // Use provided color or generate one from children text
  const colorToUse = $color || (typeof children === 'string' ? getCategoryColor(children) : COLORS[11]);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all select-none ${className}`}
      style={{ 
        backgroundColor: `${colorToUse}1A`, // 10% Opacity
        color: colorToUse,
        // border: `1px solid ${colorToUse}30` // Optional: Add subtle border
      }}
    >
      {children}
    </span>
  );
};