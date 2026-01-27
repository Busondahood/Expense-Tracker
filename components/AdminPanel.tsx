import React, { useState } from 'react';
import { Lock, ArrowLeft, Trash2, Plus, Settings, ShieldCheck, DollarSign, AlertTriangle, UserCircle } from 'lucide-react';
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
  setUserName
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-sm w-full border border-slate-100 dark:border-slate-700 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500 dark:text-slate-400">
                <Lock size={36} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t.adminLogin}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.enterPin}</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input 
                      type="password" 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-4 py-3 text-center text-3xl tracking-[0.5em] font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
                      placeholder="••••"
                      maxLength={4}
                      autoFocus
                  />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    {t.login}
                </button>
            </form>
            <button onClick={onBack} className="mt-6 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {t.back}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 shadow-sm hover:shadow"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-green-500" size={28} />
                            {t.adminSettings}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">System configuration and management</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
                
                {/* 1. Profile Settings (New) */}
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <UserCircle size={20} className="text-purple-500" />
                                {t.myProfile}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.userNameDesc}</p>
                        </div>
                        <div className="w-full sm:w-auto flex-1 max-w-xs">
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                {t.userNameInSlip}
                             </label>
                             <input 
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="e.g. Somchai Jai-dee"
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                             />
                        </div>
                    </div>
                </div>

                {/* 2. Category Management */}
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Settings size={20} className="text-blue-500" />
                                {t.manageCategories}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add, remove or manage all categories</p>
                            </div>
                            
                            <form onSubmit={handleAddCategory} className="flex gap-2 w-full sm:w-auto">
                            <input 
                                type="text" 
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                placeholder={lang === 'th' ? 'ชื่อหมวดหมู่ใหม่...' : 'New category name...'}
                                className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                                <Plus size={18} />
                                <span className="hidden sm:inline">{t.add}</span>
                            </button>
                        </form>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                            <div key={cat} className="flex items-center justify-between p-3 pl-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700 group">
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {cat}
                                </span>
                                <button 
                                    onClick={() => handleDelete(cat)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-60 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="col-span-full text-center py-6 text-slate-400 italic">
                                No categories available. Please add one.
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Budget Configuration */}
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-amber-500" />
                                {t.budgetConfig}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set limits and alerts for your spending</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={budgetSettings.enabled} 
                                    onChange={(e) => handleBudgetChange('enabled', e.target.checked)} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">{t.enableBudget}</span>
                            </label>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${budgetSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.setBudget} (฿)</label>
                            <input 
                                type="number" 
                                value={budgetSettings.limit}
                                onChange={(e) => handleBudgetChange('limit', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {t.threshold}: <span className="font-bold text-blue-600 dark:text-blue-400">{budgetSettings.alertThreshold}%</span>
                            </label>
                            <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                step="5"
                                value={budgetSettings.alertThreshold}
                                onChange={(e) => handleBudgetChange('alertThreshold', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>10%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/30">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle size={20} />
                                {t.dangerZone}
                            </h3>
                            <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">{t.resetDesc}</p>
                        </div>
                        <button 
                            onClick={onClearData}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            {t.resetData}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};