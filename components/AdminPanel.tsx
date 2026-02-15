import React, { useState } from 'react';
import { Lock, ArrowLeft, Trash2, Plus, Settings, ShieldCheck, DollarSign, AlertTriangle, UserCircle, ChevronRight, Zap } from 'lucide-react';
import { TRANSLATIONS, Language, BudgetSettings } from '../types';

interface AdminPanelProps {
  lang: Language;
  onBack: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onClearData: () => void;
  budgetSettings: BudgetSettings;
  setBudgetSettings: React.Dispatch<React.SetStateAction<BudgetSettings>>;
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  glowEnabled: boolean;
  setGlowEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  lang, 
  onBack, 
  categories, 
  setCategories, 
  onClearData,
  budgetSettings,
  setBudgetSettings,
  userName,
  setUserName,
  glowEnabled,
  setGlowEnabled
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [newCat, setNewCat] = useState('');
  const t = TRANSLATIONS[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert(t.incorrectPin);
      setPin('');
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCat = newCat.trim();
    if (trimmedCat && !categories.includes(trimmedCat)) {
      setCategories(prev => [trimmedCat, ...prev]);
      setNewCat('');
    }
  };

  const handleDelete = (cat: string) => {
    if (window.confirm(`${t.deleteCategoryConfirm} "${cat}"?`)) {
        setCategories(categories.filter(c => c !== cat));
    }
  };

  const handleBudgetChange = (key: keyof BudgetSettings, value: any) => {
    setBudgetSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-sm text-center animate-enter-card">
            <div className="w-24 h-24 bg-gray-200 dark:bg-[#1C1C1E] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm animate-scale-in">
                <Lock size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">{t.adminLogin}</h2>
            <p className="text-gray-500 mb-8">{t.enterPin}</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="flex justify-center">
                  <input 
                      type="password" 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-48 text-center text-4xl tracking-[0.5em] font-bold bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-[#007AFF] outline-none transition-all pb-2 text-black dark:text-white"
                      placeholder="••••"
                      maxLength={4}
                      autoFocus
                  />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-[#007AFF] hover:bg-[#0062c4] active:scale-95 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 ease-spring"
                >
                    {t.login}
                </button>
            </form>
            <button onClick={onBack} className="mt-6 text-sm text-[#007AFF] font-medium hover:underline">
                {t.back}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-12">
        
        {/* iOS Navigation Bar Style */}
        <div className="flex items-center justify-between mb-6 px-4 animate-enter-list delay-0">
            <button 
                onClick={onBack} 
                className="flex items-center gap-1 text-[#007AFF] active:opacity-50 transition-opacity font-medium text-lg"
            >
                <ArrowLeft size={22} />
                {t.back}
            </button>
            <h2 className="text-lg font-bold text-black dark:text-white">
                {t.adminSettings}
            </h2>
            <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        <div className="space-y-6">
            
            {/* 1. Profile Section */}
            <div className="transition-all duration-300 animate-enter-card delay-100">
                <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.myProfile}</h3>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="bg-purple-500 rounded-full p-1.5 text-white shadow-sm">
                                <UserCircle size={20} />
                             </div>
                             <span className="font-medium">{t.userNameInSlip}</span>
                         </div>
                         <input 
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Your Name"
                            className="text-right bg-transparent text-gray-500 dark:text-gray-400 focus:text-black dark:focus:text-white outline-none"
                         />
                    </div>
                </div>
                <p className="ml-4 mt-2 text-xs text-gray-400 max-w-md">{t.userNameDesc}</p>
            </div>

            {/* 1.5 Visual Effects */}
            <div className="transition-all duration-300 animate-enter-card delay-200">
                <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.visualEffects}</h3>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="bg-blue-500 rounded-full p-1.5 text-white shadow-sm">
                                <Zap size={20} />
                             </div>
                             <span className="font-medium">{t.glowEffect}</span>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={glowEnabled} 
                                onChange={(e) => setGlowEnabled(e.target.checked)} 
                                className="sr-only peer" 
                            />
                            <div className="w-[51px] h-[31px] bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[27px] after:w-[27px] after:transition-all dark:border-gray-600 peer-checked:bg-[#34C759]"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* 2. Categories */}
            <div className="transition-all duration-300 animate-enter-card delay-300">
                <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.manageCategories}</h3>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-[#2C2C2E]">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input 
                                type="text" 
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                placeholder={lang === 'th' ? 'เพิ่มหมวดหมู่...' : 'Add Category...'}
                                className="flex-1 bg-gray-100 dark:bg-black/50 px-4 py-2 rounded-xl text-black dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all"
                            />
                            <button type="submit" className="bg-[#007AFF] text-white p-2 rounded-xl active:scale-90 transition-transform shadow-lg shadow-blue-500/20">
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {categories.map((cat, index) => (
                            <div 
                                key={cat}
                                className={`flex items-center justify-between p-4 bg-white dark:bg-[#1C1C1E] active:bg-gray-50 dark:active:bg-[#2C2C2E] transition-colors ${index !== categories.length - 1 ? 'border-b border-gray-100 dark:border-[#2C2C2E]' : ''}`}
                            >
                                <span className="font-medium text-black dark:text-white ml-2">
                                    {cat}
                                </span>
                                <button 
                                    onClick={() => handleDelete(cat)}
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors active:scale-90"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Budget */}
            <div className="transition-all duration-300 animate-enter-card delay-300">
                <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.budgetConfig}</h3>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2C2C2E]">
                        <div className="flex items-center gap-3">
                             <div className="bg-amber-500 rounded-full p-1.5 text-white shadow-sm">
                                <DollarSign size={20} />
                             </div>
                             <span className="font-medium">{t.enableBudget}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={budgetSettings.enabled} 
                                onChange={(e) => handleBudgetChange('enabled', e.target.checked)} 
                                className="sr-only peer" 
                            />
                            <div className="w-[51px] h-[31px] bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[27px] after:w-[27px] after:transition-all dark:border-gray-600 peer-checked:bg-[#34C759]"></div>
                        </label>
                    </div>

                    {budgetSettings.enabled && (
                        <div className="overflow-hidden animate-scale-in origin-top">
                             <div className="p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-gray-500">{t.setBudget}</label>
                                    <input 
                                        type="number" 
                                        value={budgetSettings.limit}
                                        onChange={(e) => handleBudgetChange('limit', parseFloat(e.target.value))}
                                        className="text-right font-bold bg-transparent outline-none w-32 border-b border-transparent focus:border-[#007AFF] transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-gray-500">{t.threshold}</label>
                                        <span className="text-[#007AFF] font-bold">{budgetSettings.alertThreshold}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        step="5"
                                        value={budgetSettings.alertThreshold}
                                        onChange={(e) => handleBudgetChange('alertThreshold', parseInt(e.target.value))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#007AFF]"
                                    />
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Reset */}
            <div className="transition-all duration-300 animate-enter-card delay-300">
                 <button 
                    onClick={onClearData}
                    className="w-full bg-white dark:bg-[#1C1C1E] text-[#FF3B30] font-medium py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <Trash2 size={18} />
                    {t.resetData}
                </button>
                <p className="text-center mt-2 text-xs text-gray-400">{t.resetDesc}</p>
            </div>

        </div>
    </div>
  );
};