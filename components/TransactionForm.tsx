import React from 'react';
import { Tag as TagIcon, FileText, Image as ImageIcon, Loader2, X, Sparkles } from 'lucide-react';
import { TransactionType, TRANSLATIONS } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface TransactionFormProps {
  amount: string;
  setAmount: (v: string) => void;
  type: TransactionType;
  setType: (v: TransactionType) => void;
  category: string;
  setCategory: (v: string) => void;
  isCustomCategory: boolean;
  setIsCustomCategory: (v: boolean) => void;
  note: string;
  setNote: (v: string) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  formErrors: { amount?: string; category?: string };
  setFormErrors: (v: any) => void;
  categories: string[];
  submitting: boolean;
  isScanning: boolean;
  t: typeof TRANSLATIONS['en'];
  handleSubmit: (e: React.FormEvent) => void;
  handleCategoryChange: (val: string) => void;
  handleManualFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleScanSlip: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scanInputRef: React.RefObject<HTMLInputElement | null>;
  glowEnabled: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  amount, setAmount, type, setType, category, setCategory,
  isCustomCategory, setIsCustomCategory, note, setNote,
  file, setFile, formErrors, setFormErrors, categories,
  submitting, isScanning, t, handleSubmit, handleCategoryChange,
  handleManualFileSelect, handleScanSlip, scanInputRef, glowEnabled
}) => {
  return (
    <div className="animate-enter-card delay-100">
      <div className="flex justify-between items-center mb-3 ml-1 mr-1">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.newTransaction}</h3>
        <div className="relative">
          <input type="file" multiple={true} accept="image/*" onChange={handleScanSlip} ref={scanInputRef} className="hidden" id="ai-scan" />
          <label 
            htmlFor="ai-scan"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-300 active:scale-95 ${
              isScanning 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5'
            }`}
          >
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} fill="currentColor" />}
            {isScanning ? t.analyzing : t.scanSlip}
          </label>
        </div>
      </div>
      
      <div className="card-elevated rounded-[20px] overflow-hidden">
        {/* Type Toggle */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <div className="relative bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[8.93px] p-[2px] flex h-[32px] mx-1">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map((tabType) => (
              <button 
                key={tabType}
                type="button"
                onClick={() => setType(tabType)}
                className={`relative z-10 flex-1 text-[13px] font-semibold transition-all duration-300 ease-spring rounded-[6.93px] ${
                  type === tabType 
                  ? 'bg-white dark:bg-[#636366] text-black dark:text-white shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]'
                  : 'text-[#8E8E93] dark:text-[#EBEBF5]/60 hover:text-black dark:hover:text-white'
                }`}
              >
                {tabType === TransactionType.EXPENSE ? t.expense : t.income}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div className="p-6 flex flex-col items-center justify-center relative">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t.amount}</span>
            <div className="flex items-baseline gap-1 transform transition-transform duration-300 focus-within:scale-105">
              <span className="text-3xl font-light text-slate-300 dark:text-slate-600">฿</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => { setAmount(e.target.value); if (formErrors.amount) setFormErrors((prev: any) => ({...prev, amount: undefined})); }}
                onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                placeholder="0"
                className="bg-transparent text-center text-[52px] font-medium outline-none w-full max-w-[260px] placeholder:text-[#C7C7CC] dark:placeholder:text-[#545458] caret-ios-blue p-0 m-0 leading-tight transition-colors tracking-tight"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            {formErrors.amount && (
              <span className="absolute bottom-1 text-[10px] text-rose-500 font-semibold animate-enter-list">{formErrors.amount}</span>
            )}
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] transition-all border border-[#C6C6C8] dark:border-[#38383A] overflow-hidden">
              {/* Category */}
              <div className={`flex items-center px-4 py-3 border-b border-[#C6C6C8] dark:border-[#38383A] transition-colors ${formErrors.category ? 'bg-ios-red/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <div className="p-1.5 bg-[#007AFF] rounded-lg mr-3 shadow-sm">
                  <TagIcon size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 relative">
                  {!isCustomCategory ? (
                    <CustomDropdown 
                      options={categories}
                      value={category}
                      onChange={handleCategoryChange}
                      placeholder={formErrors.category ? formErrors.category : t.selectCategory}
                    />
                  ) : (
                    <div className="flex w-full animate-enter-list">
                      <input 
                        value={category} 
                        onChange={(e) => { setCategory(e.target.value); if (formErrors.category) setFormErrors((prev: any) => ({...prev, category: undefined})); }}
                        placeholder="New category..."
                        className="bg-transparent w-full outline-none text-[15px] font-semibold placeholder:font-normal"
                        autoFocus
                      />
                      <button onClick={() => setIsCustomCategory(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              <div className="flex items-center px-4 py-3 border-b border-[#C6C6C8] dark:border-[#38383A] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="p-1.5 bg-[#FF9500] rounded-lg mr-3 shadow-sm">
                  <FileText size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.note}
                  className="flex-1 bg-transparent outline-none text-[17px] placeholder:text-[#3C3C43]/60 dark:placeholder:text-[#EBEBF5]/60 font-medium placeholder:font-normal"
                />
              </div>

              {/* Slip */}
              <div className="flex items-center px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                <div className="p-1.5 bg-[#AF52DE] rounded-lg mr-3 shadow-sm">
                  <ImageIcon size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <input id="slip" type="file" accept="image/*" onChange={handleManualFileSelect} className="hidden" />
                <label htmlFor="slip" className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className={`text-[17px] transition-colors ${file ? 'text-ios-blue font-semibold' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                    {file ? file.name : t.slipImage}
                  </span>
                  {file && <button onClick={(e) => {e.preventDefault(); setFile(null)}}><X size={18} className="text-slate-400 hover:text-ios-red transition-colors"/></button>}
                </label>
              </div>
            </div>
          </div>

          <div className="px-4 pb-5">
            <button 
              type="submit" 
              disabled={submitting}
              className={`w-full bg-[#007AFF] hover:bg-[#007AFF]/90 active:bg-[#007AFF]/80 active:scale-95 text-white font-semibold text-[17px] py-[14px] rounded-[14px] transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${glowEnabled ? 'animate-pulse-glow' : ''}`}
            >
              {submitting ? <Loader2 className="animate-spin"/> : t.saveTransaction}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
