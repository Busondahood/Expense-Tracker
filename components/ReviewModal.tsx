import React from 'react';
import { X, Check, Loader2, Tag as TagIcon, FileText } from 'lucide-react';
import { PendingTransaction, TransactionType, TRANSLATIONS, Language } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingScans: PendingTransaction[];
  setPendingScans: React.Dispatch<React.SetStateAction<PendingTransaction[]>>;
  categories: string[];
  lang: Language;
  onConfirmAll: () => void;
  isConfirming: boolean;
  glowEnabled: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen, onClose, pendingScans, setPendingScans, categories, lang, onConfirmAll, isConfirming, glowEnabled
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleUpdateScan = (id: string, updates: Partial<PendingTransaction>) => {
    setPendingScans(prev => prev.map(scan => scan.id === id ? { ...scan, ...updates } : scan));
  };

  const handleRemoveScan = (id: string) => {
    setPendingScans(prev => prev.filter(scan => scan.id !== id));
    if (pendingScans.length <= 1) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-4">
      <div className="relative flex flex-col w-full h-[90vh] md:h-auto max-h-[90vh] md:max-w-4xl mx-auto bg-[#F2F2F7] dark:bg-black md:rounded-3xl rounded-t-[32px] overflow-hidden animate-enter-card shadow-2xl">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#C6C6C8]/50 dark:border-[#38383A]/50 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-[17px] md:text-2xl font-semibold text-black dark:text-white">
            Review Scanned Slips
          </h2>
          <p className="text-[13px] text-[#8E8E93] dark:text-[#EBEBF5]/60 font-medium mt-1">
            {pendingScans.length} {t.items} pending confirmation
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 bg-slate-100 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all active:scale-95"
          disabled={isConfirming}
        >
          <X size={20} className="stroke-[2.5]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto grid gap-6">
          {pendingScans.map((scan, index) => (
            <div key={scan.id} className="card-elevated flex flex-col md:flex-row gap-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Slip Preview Column */}
              <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-900/50 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 relative group">
                  <button 
                    onClick={() => handleRemoveScan(scan.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                    title="Remove this slip"
                  >
                    <X size={16} />
                  </button>
                  <img src={scan.previewUrl} alt="Slip Preview" className="max-h-[200px] object-contain rounded-xl shadow-sm" />
              </div>

              {/* Form Input Column */}
              <div className="w-full md:w-2/3 p-4 md:p-6 flex flex-col gap-4">
                
                {/* Type & Amount */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 w-full md:w-auto">
                    {[TransactionType.EXPENSE, TransactionType.INCOME].map((tabType) => (
                      <button 
                        key={tabType}
                        type="button"
                        onClick={() => handleUpdateScan(scan.id, { type: tabType })}
                        className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold transition-all rounded-lg ${
                          scan.type === tabType 
                          ? tabType === TransactionType.INCOME 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-md' 
                            : 'bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        {tabType === TransactionType.EXPENSE ? t.expense : t.income}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 w-full md:w-auto">
                    <span className="text-xl font-light text-slate-400">฿</span>
                    <input 
                      type="number" 
                      value={scan.amount}
                      onChange={(e) => handleUpdateScan(scan.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="bg-transparent text-right text-2xl font-black outline-none w-full max-w-[120px] text-slate-800 dark:text-white"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Category & Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 p-2 flex items-center">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg mr-2">
                       <TagIcon size={14} />
                    </div>
                    <div className="flex-1">
                      <select 
                        value={categories.includes(scan.category) ? scan.category : 'CUSTOM_NEW'}
                        onChange={(e) => handleUpdateScan(scan.id, { category: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-slate-700 dark:text-white outline-none cursor-pointer"
                      >
                        {categories.map(c => <option key={c} value={c} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">{c}</option>)}
                        {!categories.includes(scan.category) && <option value="CUSTOM_NEW">{scan.category} (New)</option>}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 p-2 flex items-center">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg mr-2">
                       <FileText size={14} />
                    </div>
                    <input 
                      value={scan.description}
                      onChange={(e) => handleUpdateScan(scan.id, { description: e.target.value })}
                      placeholder={t.notePlaceholder}
                      className="w-full flex-1 bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                {/* Status Indicator */}
                {scan.status === 'saving' && (
                  <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold mt-auto animate-pulse">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </div>
                )}
                {scan.status === 'saved' && (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold mt-auto">
                    <Check size={12} /> Saved Successfully
                  </div>
                )}
                {scan.status === 'error' && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold mt-auto">
                    <X size={12} /> {scan.error || 'Failed to save'}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 bg-white dark:bg-[#1C1C1E] border-t border-[#C6C6C8]/50 dark:border-[#38383A]/50 flex justify-end gap-3 pb-safe-offset-4">
        <button 
          onClick={onClose}
          disabled={isConfirming}
          className="px-6 py-[14px] rounded-[14px] font-semibold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirmAll}
          disabled={isConfirming || pendingScans.length === 0}
          className={`flex items-center justify-center gap-2 px-8 py-[14px] rounded-[14px] font-semibold text-white transition-all bg-[#007AFF] hover:bg-[#007AFF]/90 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${glowEnabled ? 'animate-pulse-glow' : ''}`}
        >
          {isConfirming ? (
            <><Loader2 size={18} className="animate-spin" /> {t.saving}</>
          ) : (
            <><Check size={18} strokeWidth={3} /> Confirm {pendingScans.length} Slips</>
          )}
        </button>
      </div>
    </div>
    </div>
  );
};
