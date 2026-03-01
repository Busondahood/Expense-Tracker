import React from 'react';
import { Wallet, Sun, Moon, Settings as SettingsIcon, Cloud } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  lang: string;
  toggleLanguage: () => void;
  isSyncing: boolean;
  userName: string;
  onSettingsClick: () => void;
  glowEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode, setDarkMode, lang, toggleLanguage, isSyncing, userName, onSettingsClick, glowEnabled
}) => {
  return (
    <div className="sticky top-0 z-40 header-glass border-b border-white/10 dark:border-white/5">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5 animate-enter-list delay-0">
          <div className={`h-10 w-10 bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110 hover:rotate-3 duration-300 ${glowEnabled ? 'animate-pulse-glow' : ''}`}>
            <Wallet size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight leading-none bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Expense Pro</h1>
            {isSyncing ? (
              <span className="text-[10px] text-indigo-500 flex items-center gap-1 font-semibold animate-pulse mt-0.5"><Cloud size={10} /> Syncing...</span>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 tracking-wide">My Wallet</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 animate-enter-list delay-100">
          <button onClick={toggleLanguage} className="header-btn text-[10px] font-extrabold">{lang.toUpperCase()}</button>
          <button onClick={() => setDarkMode(!darkMode)} className="header-btn">{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
          <button onClick={onSettingsClick} className="header-btn relative">
            <SettingsIcon size={14} />
            {!userName && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-[#1A1A2E]"></span>}
          </button>
        </div>
      </div>
    </div>
  );
};
