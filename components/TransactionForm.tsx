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
          <input type="file" multiple={true} accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleScanSlip} ref={scanInputRef} className="hidden" id="ai-scan" />
          <label 
            htmlFor="ai-scan"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-300 ${
              isScanning 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 hover:scale-105'
            }`}
          >
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} fill="currentColor" />}
            {isScanning ? t.analyzing : t.scanSlip}
          </label>
        </div>
      </div>
      
      <div className="card-elevated rounded-[24px] overflow-visible">
        {/* Type Toggle */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <div className="relative bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 flex h-11">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map((tabType) => (
              <button 
                key={tabType}
                type="button"
                onClick={() => setType(tabType)}
                className={`relative z-10 flex-1 text-[13px] font-bold transition-all duration-300 ease-spring rounded-xl ${
                  type === tabType 
                  ? tabType === TransactionType.INCOME 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
                className="bg-transparent text-center text-[52px] font-black outline-none w-full max-w-[260px] placeholder:text-slate-200 dark:placeholder:text-slate-800 caret-indigo-500 p-0 m-0 leading-tight transition-colors tracking-tight"
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
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-all border border-slate-100 dark:border-white/5">
              {/* Category */}
              <div className={`flex items-center px-4 py-3.5 border-b border-slate-100/80 dark:border-white/5 transition-colors rounded-t-2xl ${formErrors.category ? 'bg-rose-50 dark:bg-rose-900/10' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}>
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl mr-3 shadow-sm shadow-indigo-500/20">
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
              <div className="flex items-center px-4 py-3.5 border-b border-slate-100/80 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl mr-3 shadow-sm shadow-amber-500/20">
                  <FileText size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.note}
                  className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-slate-400 font-medium placeholder:font-normal"
                />
              </div>

              {/* Slip */}
              <div className="flex items-center px-4 py-3.5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors group rounded-b-2xl">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl mr-3 shadow-sm shadow-purple-500/20">
                  <ImageIcon size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <input id="slip" type="file" accept="image/*" onChange={handleManualFileSelect} className="hidden" />
                <label htmlFor="slip" className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className={`text-[15px] transition-colors ${file ? 'text-indigo-500 font-semibold' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                    {file ? file.name : t.slipImage}
                  </span>
                  {file && <button onClick={(e) => {e.preventDefault(); setFile(null)}}><X size={18} className="text-slate-400 hover:text-rose-500 transition-colors"/></button>}
                </label>
              </div>
            </div>
          </div>

          <div className="px-4 pb-5">
            <button 
              type="submit" 
              disabled={submitting}
              className={`w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 active:scale-[0.97] text-white font-bold text-[16px] py-4 rounded-2xl transition-all duration-300 ease-spring disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 ${glowEnabled ? 'animate-pulse-glow' : ''}`}
            >
              {submitting ? <Loader2 className="animate-spin"/> : t.saveTransaction}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
