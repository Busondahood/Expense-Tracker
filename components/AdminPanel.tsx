import React, { useState } from 'react';
import { Lock, ArrowLeft, Trash2, Plus, UserCircle, Zap, DollarSign } from 'lucide-react';
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
  saveSettingsNow: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  lang, onBack, categories, setCategories, onClearData,
  budgetSettings, setBudgetSettings, userName, setUserName, glowEnabled, setGlowEnabled, saveSettingsNow
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [newCat, setNewCat] = useState('');
  const t = TRANSLATIONS[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { setIsAuthenticated(true); } 
    else { alert(t.incorrectPin); setPin(''); }
  };

  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCat = newCat.trim();
    if (trimmedCat && !categories.includes(trimmedCat)) {
      setCategories(prev => [trimmedCat, ...prev]);
      setNewCat('');
      // Immediate save after category add
      setTimeout(() => saveSettingsNow(), 50);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirmingDelete === cat) {
      // Second click = confirmed
      setCategories(prev => prev.filter(c => c !== cat));
      setConfirmingDelete(null);
      // Immediate save after category delete
      setTimeout(() => saveSettingsNow(), 50);
    } else {
      // First click = show confirm state
      setConfirmingDelete(cat);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setConfirmingDelete(prev => prev === cat ? null : prev), 3000);
    }
  };

  const handleBudgetChange = (key: keyof BudgetSettings, value: any) => {
    setBudgetSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-sm text-center animate-enter-card">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-scale-in">
            <Lock size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t.adminLogin}</h2>
          <p className="text-slate-400 mb-8 text-sm">{t.enterPin}</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex justify-center">
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-48 text-center text-4xl tracking-[0.5em] font-black bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-all pb-2 text-slate-900 dark:text-white"
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-[0.97] text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 ease-spring"
            >
              {t.login}
            </button>
          </form>
          <button onClick={onBack} className="mt-6 text-sm text-indigo-500 font-semibold hover:underline">{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-12 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 animate-enter-list delay-0">
        <button onClick={onBack} className="flex items-center gap-1 text-indigo-500 active:opacity-50 transition-opacity font-semibold text-lg">
          <ArrowLeft size={22} /> {t.back}
        </button>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t.adminSettings}</h2>
        <div className="w-10"></div>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div className="animate-enter-card delay-100">
          <h3 className="ml-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.myProfile}</h3>
          <div className="card-elevated rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl p-1.5 text-white shadow-sm shadow-violet-500/20">
                  <UserCircle size={20} />
                </div>
                <span className="font-semibold text-sm">{t.userNameInSlip}</span>
              </div>
              <input 
                type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Name"
                className="text-right bg-transparent text-slate-400 focus:text-slate-900 dark:focus:text-white outline-none text-sm font-medium"
              />
            </div>
          </div>
          <p className="ml-1 mt-2 text-[11px] text-slate-400">{t.userNameDesc}</p>
        </div>

        {/* Visual Effects */}
        <div className="animate-enter-card delay-200">
          <h3 className="ml-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.visualEffects}</h3>
          <div className="card-elevated rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-1.5 text-white shadow-sm shadow-cyan-500/20">
                  <Zap size={20} />
                </div>
                <span className="font-semibold text-sm">{t.glowEffect}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={glowEnabled} onChange={(e) => setGlowEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-[51px] h-[31px] bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[27px] after:w-[27px] after:transition-all after:shadow-sm dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="animate-enter-card delay-300">
          <h3 className="ml-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.manageCategories}</h3>
          <div className="card-elevated rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
            <div className="p-4 border-b border-slate-100 dark:border-white/5">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input 
                  type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  placeholder={lang === 'th' ? 'เพิ่มหมวดหมู่...' : 'Add Category...'}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm border border-slate-100 dark:border-white/5"
                />
                <button type="submit" className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-2.5 rounded-xl active:scale-90 transition-transform shadow-lg shadow-indigo-500/20">
                  <Plus size={18} />
                </button>
              </form>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {categories.map((cat, index) => (
                <div 
                  key={cat}
                  className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all ${index !== categories.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''} ${confirmingDelete === cat ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}
                >
                  <span className="font-semibold text-sm text-slate-900 dark:text-white ml-2">{cat}</span>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteCategory(cat); }}
                    className={`p-2 rounded-xl transition-all active:scale-90 ${
                      confirmingDelete === cat 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-scale-in' 
                        : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    }`}
                    title={confirmingDelete === cat ? 'Click again to confirm' : 'Delete category'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="animate-enter-card delay-300">
          <h3 className="ml-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.budgetConfig}</h3>
          <div className="card-elevated rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-1.5 text-white shadow-sm shadow-amber-500/20">
                  <DollarSign size={20} />
                </div>
                <span className="font-semibold text-sm">{t.enableBudget}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={budgetSettings.enabled} onChange={(e) => handleBudgetChange('enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-[51px] h-[31px] bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[27px] after:w-[27px] after:transition-all after:shadow-sm dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            {budgetSettings.enabled && (
              <div className="overflow-hidden animate-scale-in origin-top">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-400 font-medium">{t.setBudget}</label>
                    <input 
                      type="number" value={budgetSettings.limit}
                      onChange={(e) => handleBudgetChange('limit', parseFloat(e.target.value))}
                      className="text-right font-bold bg-transparent outline-none w-32 border-b border-transparent focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-slate-400 font-medium">{t.threshold}</label>
                      <span className="text-indigo-500 font-bold">{budgetSettings.alertThreshold}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" step="5"
                      value={budgetSettings.alertThreshold}
                      onChange={(e) => handleBudgetChange('alertThreshold', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="animate-enter-card delay-400">
          <button 
            onClick={onClearData}
            className="w-full card-elevated text-rose-500 font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-rose-50 dark:hover:bg-rose-900/10 border border-slate-100 dark:border-white/5 text-sm"
          >
            <Trash2 size={16} /> {t.resetData}
          </button>
          <p className="text-center mt-2 text-[11px] text-slate-400">{t.resetDesc}</p>
        </div>
      </div>
    </div>
  );
};