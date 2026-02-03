import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  Calendar,
  Tag,
  FileText,
  AlertTriangle,
  X,
  Moon,
  Sun,
  Globe,
  Trash2,
  Filter,
  BarChart3,
  ChevronDown,
  RefreshCw,
  Download,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image,
  PieChart,
  Settings as SettingsIcon,
  Cloud,
  Check,
  Search,
  ChevronRight
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { StatsCard } from './components/StatsCard';
import { SlipModal } from './components/SlipModal';
import { ExpenseChart } from './components/ExpenseChart';
import { MonthlyChart } from './components/MonthlyChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { AdminPanel } from './components/AdminPanel';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats, Language, TRANSLATIONS, BudgetSettings } from './types';

declare global {
  interface Window {
    html2canvas: any;
  }
}

const loadHtml2Canvas = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("Failed to load html2canvas"));
    document.head.appendChild(script);
  });
};

// --- Helper Component for Number Animation ---
const CountUpAnimation = ({ end, duration = 1500 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0); // Use ref to keep track of the animation start point properly

  useEffect(() => {
    const start = countRef.current;
    const change = end - start;
    
    // If change is tiny, just set it immediately to avoid jitter
    if (Math.abs(change) < 0.01) {
      setCount(end);
      countRef.current = end;
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuart (starts fast, slows down smoothly)
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = start + (change * ease);
      setCount(current);
      countRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end); // Ensure we land exactly on the target
        countRef.current = end;
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration]);

  return <>{count.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

const ConfigError = ({ t }: { t: typeof TRANSLATIONS['en'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black p-6 font-sans text-slate-900 dark:text-white">
    <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-[#FF3B30] rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold mb-3">{t.connectionRequired}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
        {t.connectionDesc}
      </p>
    </div>
  </div>
);

function ExpenseTracker() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    document.title = t.appTitle;
  }, [t.appTitle]);

  const client = supabase!;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [chartView, setChartView] = useState<'daily' | 'monthly' | 'pie'>('daily');
  
  const [categories, setCategories] = useState<string[]>(Array.from(DEFAULT_CATEGORIES));
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ enabled: false, limit: 10000, alertThreshold: 80 });
  const [userName, setUserName] = useState<string>('กิตติภณ สุกัญญา');
  const [glowEnabled, setGlowEnabled] = useState<boolean>(false);
  
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | null; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [note, setNote] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<Stats>({ balance: 0, income: 0, expense: 0 });

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data, error } = await client
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        if (data.categories) setCategories(data.categories);
        if (data.budget_settings) setBudgetSettings(data.budget_settings);
        if (data.user_name) setUserName(data.user_name);
        if (data.glow_enabled !== undefined) setGlowEnabled(data.glow_enabled);
      } else {
        const defaultSettings = {
          id: 1,
          categories: Array.from(DEFAULT_CATEGORIES),
          budget_settings: { enabled: false, limit: 10000, alertThreshold: 80 },
          user_name: 'กิตติภณ สุกัญญา',
          glow_enabled: false
        };
        await client.from('app_settings').insert(defaultSettings);
      }
    } catch (err) {
      console.error("Unexpected error loading settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settingsLoading) return;
    const saveSettings = async () => {
      setIsSyncing(true);
      try {
        await client.from('app_settings').upsert({
            id: 1,
            categories,
            budget_settings: budgetSettings,
            user_name: userName,
            glow_enabled: glowEnabled,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error("Error syncing settings:", err);
      } finally {
        setIsSyncing(false);
      }
    };
    const timeoutId = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [categories, budgetSettings, userName, glowEnabled, settingsLoading, client]);

  useEffect(() => {
    if (!isCustomCategory) {
      if (!categories.includes(category) && categories.length > 0) {
        setCategory(categories[0]);
      } else if (categories.length === 0) {
        setCategory('');
      } else if (category === '') {
          setCategory(categories[0]);
      }
    }
  }, [categories, category, isCustomCategory]);

  const fetchTransactions = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true); 
      const { data, error } = await client
        .from('transactions')
        .select('*');
      if (error) throw error;
      if (data) {
        setTransactions(data as Transaction[]);
        calculateStats(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const calculateStats = (data: Transaction[]) => {
    const income = data
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = data
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    setStats({ income, expense, balance: income - expense });
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const finalCategory = category.trim();
    if (!finalCategory) { alert("Please enter a category"); return; }
    if (isCustomCategory && !categories.includes(finalCategory)) {
      setCategories(prev => [finalCategory, ...prev]); 
    }

    try {
      setSubmitting(true);
      let slipUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await client.storage.from('slips').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = client.storage.from('slips').getPublicUrl(filePath);
        slipUrl = publicUrl;
      }
      const { error: insertError } = await client.from('transactions').insert([{
            amount: parseFloat(amount),
            type,
            category: finalCategory,
            description: note.trim(),
            slip_url: slipUrl,
            created_at: new Date().toISOString(),
          }]);
      if (insertError) throw insertError;
      setAmount('');
      setNote('');
      setFile(null);
      if (categories.length > 0) setCategory(categories[0]);
      setIsCustomCategory(false);
      const fileInput = document.getElementById('slip-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchTransactions(true);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      const { error } = await client.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await fetchTransactions(true);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t.confirmClearAll)) return;
    if (!window.confirm("CONFIRMATION: Delete all data permanently?")) return;
    try {
      setLoading(true); 
      const { error } = await client.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (error) throw error;
      await fetchTransactions();
      alert("All data cleared.");
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactions.map(t => {
      const date = new Date(t.created_at).toISOString();
      const note = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
      return [date, t.type, t.category, t.amount, note].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerImport = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');
        const newTransactions = [];
        for (const line of dataRows) {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (matches && matches.length >= 4) {
             const cols = line.split(',');
             if (cols.length < 4) continue;
             const type = cols[1].toLowerCase().includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
             const amount = parseFloat(cols[3]);
             if (isNaN(amount)) continue;
             let note = cols.slice(4).join(',');
             note = note.replace(/^"|"$/g, '').replace(/""/g, '"');
             newTransactions.push({
               created_at: new Date(cols[0]).toISOString(),
               type: type,
               category: cols[2],
               amount: amount,
               description: note,
               slip_url: null 
             });
          }
        }
        if (newTransactions.length > 0) {
          await client.from('transactions').insert(newTransactions);
          alert(`${t.importSuccess} (${newTransactions.length} items)`);
          await fetchTransactions();
        } else {
          alert(t.importError);
        }
      } catch (err) {
        console.error("Import error", err);
        alert(t.importError);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadChart = async () => {
    if (chartRef.current) {
      try {
        if (!window.html2canvas) await loadHtml2Canvas();
        const canvas = await window.html2canvas(chartRef.current, { backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', scale: 2 });
        const link = document.createElement('a');
        link.download = `expense_chart.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) { alert("Failed to save chart."); }
    }
  };

  const handleViewSlip = (url: string) => { setSelectedSlip(url); setModalOpen(true); };
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_NEW') { setIsCustomCategory(true); setCategory(''); } 
    else { setIsCustomCategory(false); setCategory(val); }
  };
  const toggleLanguage = () => { setLang(prev => prev === 'en' ? 'th' : 'en'); };
  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    if (filterCategory !== 'ALL') data = data.filter(t => t.category === filterCategory);
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [transactions, filterCategory, sortConfig]);

  const availableFilterCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    categories.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [transactions, categories]);

  // Glow Class Generator
  const glowClass = glowEnabled 
    ? 'shadow-[0_0_20px_-5px_rgba(0,122,255,0.3)] dark:shadow-[0_0_20px_-5px_rgba(0,122,255,0.2)] border border-[#007AFF]/20' 
    : 'shadow-sm';

  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans transition-colors duration-300">
         <AdminPanel 
            lang={lang}
            onBack={() => setCurrentView('dashboard')}
            categories={categories}
            setCategories={setCategories}
            onClearData={handleClearAll}
            budgetSettings={budgetSettings}
            setBudgetSettings={setBudgetSettings}
            userName={userName}
            setUserName={setUserName}
            glowEnabled={glowEnabled}
            setGlowEnabled={setGlowEnabled}
         />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans text-slate-900 dark:text-white transition-colors duration-300 pb-20">
      
      {/* 1. Glassmorphism Header */}
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 transition-all">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className={`h-9 w-9 bg-black dark:bg-white rounded-[10px] flex items-center justify-center text-white dark:text-black shadow-lg shadow-black/10 ${glowEnabled ? 'shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                    <Wallet size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-base font-bold tracking-tight leading-none">Expense Pro</h1>
                    {isSyncing ? (
                         <span className="text-[10px] text-[#007AFF] flex items-center gap-1 font-medium animate-pulse mt-0.5"><Cloud size={10} /> Syncing</span>
                    ) : (
                         <span className="text-[10px] text-gray-400 font-medium mt-0.5">My Wallet</span>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={toggleLanguage} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] text-[10px] font-bold active:scale-90 transition-transform">{lang.toUpperCase()}</button>
                  <button onClick={() => setDarkMode(!darkMode)} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] active:scale-90 transition-transform">{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
                  <button onClick={() => setCurrentView('admin')} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] active:scale-90 transition-transform relative">
                      <SettingsIcon size={14} />
                      {!userName && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF3B30] rounded-full border border-white dark:border-[#2C2C2E]"></span>}
                  </button>
              </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* LEFT COLUMN (Summary & Form) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Balance Card (Wallet Style) */}
          <div className={`bg-white dark:bg-[#1C1C1E] rounded-[28px] p-6 relative overflow-hidden transition-all hover:scale-[1.01] duration-300 ${glowClass}`}>
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">{t.totalBalance}</span>
                    <div className="bg-[#007AFF]/10 p-1.5 rounded-full text-[#007AFF]">
                        <TrendingUp size={16} />
                    </div>
                </div>
                
                <h2 className={`text-[40px] leading-tight font-bold tracking-tight mb-6 ${glowEnabled ? 'drop-shadow-[0_0_15px_rgba(0,122,255,0.6)]' : ''}`}>
                  ฿<CountUpAnimation end={stats.balance} />
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 dark:bg-[#2C2C2E] p-4 rounded-2xl flex items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                      <div className="p-2 bg-[#34C759]/10 rounded-full text-[#34C759]">
                          <ArrowUp size={16} strokeWidth={3} />
                      </div>
                      <div>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase">{t.income}</div>
                          <div className="text-sm font-bold">฿{stats.income.toLocaleString()}</div>
                      </div>
                   </div>
                   <div className="bg-gray-50 dark:bg-[#2C2C2E] p-4 rounded-2xl flex items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                      <div className="p-2 bg-[#FF3B30]/10 rounded-full text-[#FF3B30]">
                          <ArrowDown size={16} strokeWidth={3} />
                      </div>
                      <div>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase">{t.expense}</div>
                          <div className="text-sm font-bold">฿{stats.expense.toLocaleString()}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* iOS Style Input Group */}
          <div>
             <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.newTransaction}</h3>
             
             <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden ${glowClass}`}>
                 
                 {/* 1. Segmented Control (Animated) */}
                 <div className="p-4 border-b border-gray-100 dark:border-[#2C2C2E]">
                    <div className="relative bg-[#767680]/10 dark:bg-[#767680]/20 rounded-[9px] p-0.5 flex h-9">
                        <div 
                            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-white dark:bg-[#636366] rounded-[7px] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${type === TransactionType.INCOME ? 'left-[calc(50%+0px)]' : 'left-0.5'}`}
                        ></div>
                        <button 
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`relative z-10 flex-1 text-[13px] font-semibold transition-colors duration-200 ${type === TransactionType.EXPENSE ? 'text-black dark:text-white' : 'text-gray-500'}`}
                        >
                            {t.expense}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`relative z-10 flex-1 text-[13px] font-semibold transition-colors duration-200 ${type === TransactionType.INCOME ? 'text-black dark:text-white' : 'text-gray-500'}`}
                        >
                            {t.income}
                        </button>
                    </div>
                 </div>

                 <form onSubmit={handleSubmit}>
                    <div className="p-6 flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-400 font-medium mb-1">{t.amount}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-light text-gray-400">฿</span>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-center text-[56px] font-semibold outline-none w-full max-w-[240px] placeholder:text-gray-200 dark:placeholder:text-gray-800 caret-[#007AFF] p-0 m-0 leading-tight"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Grouped List Inputs */}
                    <div className="px-4 pb-4">
                        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-[16px] overflow-hidden">
                            {/* Category Row */}
                            <div className="flex items-center px-4 py-3 border-b border-gray-300/50 dark:border-white/10">
                                <div className="p-1.5 bg-[#007AFF] rounded-[6px] mr-3">
                                    <Tag size={14} className="text-white" />
                                </div>
                                <div className="flex-1 relative">
                                    {!isCustomCategory ? (
                                        <select 
                                            value={category}
                                            onChange={handleCategorySelect}
                                            className="w-full bg-transparent appearance-none outline-none text-[15px] font-medium text-black dark:text-white"
                                        >
                                            <option value="" className="text-gray-400">{t.selectCategory}</option>
                                            {categories.map(c => <option key={c} value={c} className="text-black dark:text-white bg-white dark:bg-black">{c}</option>)}
                                            <option value="CUSTOM_NEW" className="text-[#007AFF] font-bold">+ {t.addNewCategory}</option>
                                        </select>
                                    ) : (
                                        <div className="flex w-full">
                                            <input 
                                                value={category} 
                                                onChange={(e) => setCategory(e.target.value)}
                                                placeholder="New category..."
                                                className="bg-transparent w-full outline-none text-[15px]"
                                                autoFocus
                                            />
                                            <button onClick={() => setIsCustomCategory(false)} className="text-gray-400"><X size={16}/></button>
                                        </div>
                                    )}
                                </div>
                                {!isCustomCategory && <ChevronDown size={16} className="text-gray-400 pointer-events-none" />}
                            </div>

                            {/* Note Row */}
                            <div className="flex items-center px-4 py-3 border-b border-gray-300/50 dark:border-white/10">
                                <div className="p-1.5 bg-[#FF9500] rounded-[6px] mr-3">
                                    <FileText size={14} className="text-white" />
                                </div>
                                <input 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={t.note}
                                    className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-gray-400"
                                />
                            </div>

                            {/* Slip Row */}
                            <div className="flex items-center px-4 py-3">
                                <div className="p-1.5 bg-[#AF52DE] rounded-[6px] mr-3">
                                    <ImageIcon size={14} className="text-white" />
                                </div>
                                <input id="slip" type="file" accept="image/*" onChange={handleManualFileSelect} className="hidden" />
                                <label htmlFor="slip" className="flex-1 flex items-center justify-between cursor-pointer">
                                    <span className={`text-[15px] ${file ? 'text-[#007AFF]' : 'text-gray-400'}`}>
                                        {file ? file.name : t.slipImage}
                                    </span>
                                    {file && <button onClick={(e) => {e.preventDefault(); setFile(null)}}><X size={16} className="text-gray-400"/></button>}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className={`w-full bg-[#007AFF] hover:bg-[#0062c4] text-white font-semibold text-[17px] py-3.5 rounded-[14px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${glowEnabled ? 'shadow-[0_0_25px_rgba(0,122,255,0.6)]' : 'shadow-lg shadow-blue-500/20'}`}
                        >
                            {submitting ? <Loader2 className="animate-spin"/> : t.saveTransaction}
                        </button>
                    </div>
                 </form>
             </div>
          </div>

          {/* Charts Area (Widget Style) */}
          <div>
            <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.chartTitle}</h3>
            <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 ${glowClass}`} ref={chartRef}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex bg-[#767680]/10 dark:bg-[#767680]/20 p-0.5 rounded-lg">
                    {['daily', 'monthly', 'pie'].map((v) => (
                        <button key={v} onClick={() => setChartView(v as any)} className={`px-3 py-1 text-[13px] font-medium rounded-[6px] capitalize transition-all ${chartView === v ? 'bg-white dark:bg-[#636366] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                            {v === 'pie' ? t.viewPie : v === 'monthly' ? t.viewMonthly : t.viewDaily}
                        </button>
                    ))}
                    </div>
                    <button onClick={handleDownloadChart} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-[#2C2C2E] rounded-full text-[#007AFF] active:scale-90 transition-transform"><Image size={16}/></button>
                </div>
                {chartView === 'daily' && <ExpenseChart transactions={transactions} />}
                {chartView === 'monthly' && <MonthlyChart transactions={transactions} lang={lang} />}
                {chartView === 'pie' && <CategoryPieChart transactions={transactions} />}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Transactions List - List Style) */}
        <div className="lg:col-span-5">
           <div>
              <div className="flex items-center justify-between mb-4 ml-4 mr-2">
                 <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.recentTransactions}</h3>
                 <div className="flex items-center gap-2">
                    <button onClick={() => fetchTransactions()} className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-colors ${loading ? 'animate-spin text-[#007AFF]' : 'text-gray-400'}`}><RefreshCw size={14}/></button>
                    
                    <div className="flex gap-2">
                        <button onClick={handleExportCSV} className="text-[#007AFF] text-[13px] font-medium active:opacity-50">{t.exportCSV}</button>
                        <button onClick={triggerImport} className="text-[#007AFF] text-[13px] font-medium active:opacity-50">{t.importCSV}</button>
                    </div>
                 </div>
              </div>

              {/* Category Filter Dropdown */}
              <div className="mb-4 px-4">
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                          <Filter size={14} />
                      </div>
                      <select 
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white text-[13px] font-medium py-2.5 pl-9 pr-8 rounded-xl appearance-none shadow-sm outline-none transition-all cursor-pointer"
                      >
                          <option value="ALL">{t.allCategories}</option>
                          {availableFilterCategories.map(c => (
                              <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          <ChevronDown size={14} />
                      </div>
                  </div>
              </div>

              <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden min-h-[400px] ${glowClass}`}>
                  <div className="overflow-y-auto max-h-[800px] custom-scrollbar">
                      {loading ? (
                          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                              <Loader2 className="animate-spin mb-2" />
                              <span className="text-xs">{t.loading}</span>
                          </div>
                      ) : filteredTransactions.length === 0 ? (
                          <div className="text-center py-20 text-gray-400 text-sm">{t.noTransactions}</div>
                      ) : (
                          <div className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
                              {filteredTransactions.map((t) => (
                              <div key={t.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors cursor-default relative">
                                  <div className="flex items-center gap-3">
                                      {/* Status Dot */}
                                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                          t.type === TransactionType.INCOME 
                                          ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]' 
                                          : 'bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.5)]'
                                      }`}></div>
                                      
                                      <div>
                                          <div className="font-semibold text-[15px] text-black dark:text-white leading-tight">{t.category}</div>
                                          <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                          {new Date(t.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })}
                                          {t.description && <span className="text-gray-400">• {t.description}</span>}
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          <div className={`font-semibold text-[15px] ${
                                              t.type === TransactionType.INCOME 
                                                ? 'text-[#34C759]' 
                                                : 'text-black dark:text-white'
                                            } ${
                                              glowEnabled 
                                                ? t.type === TransactionType.INCOME 
                                                    ? 'drop-shadow-[0_0_8px_rgba(52,199,89,0.8)]' 
                                                    : 'drop-shadow-[0_0_8px_rgba(255,59,48,0.8)]' 
                                                : ''
                                            }`}>
                                              {t.type === TransactionType.INCOME ? '+' : '-'}฿{t.amount.toLocaleString()}
                                          </div>
                                          {t.slip_url && (
                                              <div onClick={(e) => { e.stopPropagation(); handleViewSlip(t.slip_url!)}} className="flex items-center justify-end gap-1 text-[11px] text-[#007AFF] cursor-pointer mt-0.5 hover:underline">
                                                  <Eye size={10} /> View Slip
                                              </div>
                                          )}
                                      </div>
                                      <button 
                                          onClick={() => handleDelete(t.id)}
                                          className="text-gray-300 hover:text-[#FF3B30] p-1 rounded-full transition-colors active:scale-90"
                                      >
                                          <Trash2 size={16} />
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
        </div>

      </div>

      <SlipModal isOpen={modalOpen} onClose={() => setModalOpen(false)} imageUrl={selectedSlip} />
    </div>
  );
}

function App() {
  const [tempLang] = useState<Language>('en'); 
  if (!supabase) return <ConfigError t={TRANSLATIONS[tempLang]} />;
  return <ExpenseTracker />;
}

export default App;