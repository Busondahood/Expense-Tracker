import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { Tag } from './Tag';

interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowAdd?: boolean; // New prop to control "Add New" option
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  allowAdd = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent outline-none text-[15px] font-medium text-black dark:text-white cursor-pointer py-1.5 min-h-[32px]"
      >
        <span className={!value ? 'text-gray-400 font-normal' : ''}>
          {value ? <Tag>{value}</Tag> : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-300 ease-spring ${isOpen ? 'rotate-180 text-[#007AFF]' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 z-[100] overflow-hidden origin-top animate-scale-in">
          <ul className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
            {options.map((option, index) => (
              <li 
                key={option}
                onClick={() => handleSelect(option)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 animate-enter-list ${
                  value === option 
                    ? 'bg-[#007AFF]/5' 
                    : 'hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Tag>{option}</Tag>
                {value === option && <Check size={14} className="text-[#007AFF]" />}
              </li>
            ))}
            
            {allowAdd && (
                <>
                    <div className="h-px bg-gray-200 dark:bg-white/10 my-1 mx-2"></div>
                    {/* Add New Button */}
                    <li 
                    onClick={() => handleSelect('CUSTOM_NEW')}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors animate-enter-list"
                    style={{ animationDelay: `${options.length * 30}ms` }}
                    >
                    <Plus size={14} />
                    <span className="text-[13px] font-bold">Add New Category</span>
                    </li>
                </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};