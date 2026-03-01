import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { Tag } from './Tag';

interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowAdd?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, value, onChange, placeholder, allowAdd = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => { onChange(option); setIsOpen(false); };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent outline-none text-[15px] font-semibold text-slate-900 dark:text-white cursor-pointer py-1.5 min-h-[32px]"
      >
        <span className={!value ? 'text-slate-400 font-normal' : ''}>
          {value ? <Tag>{value}</Tag> : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-300 ease-spring ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 card-elevated backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 z-[100] overflow-hidden origin-top animate-scale-in">
          <ul className="max-h-[240px] overflow-y-auto custom-scrollbar p-1.5">
            {options.map((option, index) => (
              <li 
                key={option}
                onClick={() => handleSelect(option)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 animate-enter-list ${
                  value === option 
                    ? 'bg-indigo-500/5' 
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <Tag>{option}</Tag>
                {value === option && <Check size={14} className="text-indigo-500" />}
              </li>
            ))}
            
            {allowAdd && (
              <>
                <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2"></div>
                <li 
                  onClick={() => handleSelect('CUSTOM_NEW')}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors animate-enter-list font-bold"
                  style={{ animationDelay: `${options.length * 25}ms` }}
                >
                  <Plus size={14} />
                  <span className="text-[13px]">Add New Category</span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};