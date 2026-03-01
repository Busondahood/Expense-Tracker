import React from 'react';
import { Loader2, Trash2, Eye, RefreshCw, Search, X } from 'lucide-react';
import { Transaction, TransactionType, TRANSLATIONS, Language } from '../types';
import { CustomDropdown } from './CustomDropdown';
import { Tag } from './Tag';

interface TransactionListProps {
  filteredTransactions: Transaction[];
  loading: boolean;
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  glowEnabled: boolean;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  availableFilterCategories: string[];
  handleDelete: (id: string) => void;
  handleViewSlip: (url: string) => void;
  handleExportCSV: () => void;
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerImport: () => void;
  fetchTransactions: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  filteredTransactions, loading, lang, t, glowEnabled,
  filterCategory, setFilterCategory, searchTerm, setSearchTerm,
  availableFilterCategories, handleDelete, handleViewSlip,
  handleExportCSV, handleImportCSV, triggerImport, fetchTransactions, fileInputRef
}) => {
  return (
    <div className="animate-enter-list delay-300">
      <div className="flex items-center justify-between mb-4 ml-1 mr-1">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.recentTransactions}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchTransactions()} className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:rotate-180 duration-500 ${loading ? 'animate-spin text-indigo-500' : 'text-slate-400'}`}><RefreshCw size={13}/></button>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="text-indigo-500 text-[11px] font-bold active:opacity-50 transition-opacity hover:text-indigo-600">{t.exportCSV}</button>
            <button onClick={triggerImport} className="text-indigo-500 text-[11px] font-bold active:opacity-50 transition-opacity hover:text-indigo-600">{t.importCSV}</button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search note, amount, category..."
            className="w-full card-elevated text-slate-900 dark:text-white text-[13px] py-3 pl-10 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400 border border-slate-100 dark:border-white/5"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 relative z-20">
        <CustomDropdown
          options={['ALL', ...availableFilterCategories]}
          value={filterCategory === 'ALL' ? t.allCategories : filterCategory}
          onChange={(val) => setFilterCategory(val === t.allCategories ? 'ALL' : val)}
          placeholder={t.filterByCategory}
          allowAdd={false}
        />
      </div>

      {/* Transaction Cards */}
      <div className="card-elevated rounded-[24px] overflow-hidden min-h-[400px] border border-slate-100 dark:border-white/5">
        <div className="overflow-y-auto max-h-[800px] custom-scrollbar p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
              <Loader2 className="animate-spin mb-3" size={24} />
              <span className="text-xs font-medium">{t.loading}</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20 animate-scale-in">
              <div className="text-4xl mb-3">💸</div>
              <p className="text-slate-400 text-sm font-medium">{t.noTransactions}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((txn, index) => (
                <div 
                  key={txn.id}
                  className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 ease-spring cursor-default relative animate-enter-list hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${
                      txn.type === TransactionType.INCOME 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      <span className="text-lg">{txn.type === TransactionType.INCOME ? '↗' : '↙'}</span>
                    </div>
                    
                    <div>
                      <Tag>{txn.category}</Tag>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        {new Date(txn.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })}
                        {txn.description && <span className="text-slate-300 dark:text-slate-600">• {txn.description}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className={`font-bold text-[15px] tracking-tight ${
                        txn.type === TransactionType.INCOME 
                          ? 'text-emerald-500' 
                          : 'text-slate-900 dark:text-white'
                      } ${
                        glowEnabled 
                          ? txn.type === TransactionType.INCOME 
                              ? 'drop-shadow-[0_0_8px_rgba(52,199,89,0.6)]' 
                              : 'drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]' 
                          : ''
                      }`}>
                        {txn.type === TransactionType.INCOME ? '+' : '-'}฿{txn.amount.toLocaleString()}
                      </div>
                      {txn.slip_url && (
                        <div onClick={(e) => { e.stopPropagation(); handleViewSlip(txn.slip_url!)}} className="flex items-center justify-end gap-1 text-[10px] text-indigo-500 cursor-pointer mt-0.5 hover:underline opacity-70 hover:opacity-100 font-semibold">
                          <Eye size={10} /> View Slip
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDelete(txn.id)}
                      className="text-slate-200 dark:text-slate-700 hover:text-rose-500 p-1.5 rounded-xl transition-all active:scale-90 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
    </div>
  );
};
