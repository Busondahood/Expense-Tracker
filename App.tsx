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
  Cloud
} from 'lucide-react';
// html2canvas import removed to avoid build errors; loaded via CDN in index.html
import { supabase } from './supabaseClient';
import { StatsCard } from './components/StatsCard';
import { SlipModal } from './components/SlipModal';
import { ExpenseChart } from './components/ExpenseChart';
import { MonthlyChart } from './components/MonthlyChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { AdminPanel } from './components/AdminPanel';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats, Language, TRANSLATIONS, BudgetSettings } from './types';

// Declare html2canvas on window
declare global {
  interface Window {
    html2canvas: any;
  }
}

// Helper to load html2canvas dynamically if it's missing
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

// Component to show when Supabase is not configured
const ConfigError = ({ t }: { t: typeof TRANSLATIONS['en'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100 transition-colors">
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-lg w-full text-center border border-slate-100 dark:border-slate-700">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-3">{t.connectionRequired}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {t.connectionDesc}
      </p>
      
      <div className="text-left bg-slate-900 rounded-lg p-4 mb-6 overflow-x-auto shadow-inner">
        <code className="text-xs font-mono text-green-400 block mb-2"># .env</code>
        <div className="text-xs font-mono text-slate-300 space-y-1">
          <div><span className="text-purple-400">VITE_SUPABASE_URL</span>=https://your-project.supabase.co</div>
          <div><span className="text-purple-400">VITE_SUPABASE_ANON_KEY</span>=your-anon-key</div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        See <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">SUPABASE_SETUP.md</code> for setup instructions.
      </p>
    </div>
  </div>
);

function ExpenseTracker() {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Language State
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  // View State (Dashboard or Admin)
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  // Apply Theme Effect
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

  // Update Document Title based on language
  useEffect(() => {
    document.title = t.appTitle;
  }, [t.appTitle]);

  // Safe to assert supabase is not null here because parent checks it
  const client = supabase!;

  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [chartView, setChartView] = useState<'daily' | 'monthly' | 'pie'>('daily');
  
  // --- SYNCED STATES (Initialized with defaults, updated from Supabase) ---
  const [categories, setCategories] = useState<string[]>(Array.from(DEFAULT_CATEGORIES));
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ enabled: false, limit: 10000, alertThreshold: 80 });
  const [userName, setUserName] = useState<string>('กิตติภณ สุกัญญา');
  
  // Loading state for settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | null; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [note, setNote] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // Import CSV Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Chart Ref
  const chartRef = useRef<HTMLDivElement>(null);

  // Derived Stats
  const [stats, setStats] = useState<Stats>({ balance: 0, income: 0, expense: 0 });

  // --- FETCH SETTINGS FROM SUPABASE (REPLACES LOCALSTORAGE) ---
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      // We use ID=1 for the single global settings row
      const { data, error } = await client
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error fetching settings:', error);
      }

      if (data) {
        // Settings exist, use them
        if (data.categories) setCategories(data.categories);
        if (data.budget_settings) setBudgetSettings(data.budget_settings);
        if (data.user_name) setUserName(data.user_name);
      } else {
        // No settings found (first time), create default row
        const defaultSettings = {
          id: 1,
          categories: Array.from(DEFAULT_CATEGORIES),
          budget_settings: { enabled: false, limit: 10000, alertThreshold: 80 },
          user_name: 'กิตติภณ สุกัญญา'
        };
        
        await client.from('app_settings').insert(defaultSettings);
        // Defaults are already set in useState
      }
    } catch (err) {
      console.error("Unexpected error loading settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, [client]);

  // Load Settings on Mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // --- SAVE SETTINGS TO SUPABASE ---
  // Debounce saving to avoid too many API calls
  useEffect(() => {
    if (settingsLoading) return; // Don't save if initial load hasn't happened

    const saveSettings = async () => {
      setIsSyncing(true);
      try {
        const { error } = await client
          .from('app_settings')
          .upsert({
            id: 1,
            categories,
            budget_settings: budgetSettings,
            user_name: userName,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      } catch (err) {
        console.error("Error syncing settings:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(saveSettings, 1000); // 1 second debounce
    return () => clearTimeout(timeoutId);

  }, [categories, budgetSettings, userName, settingsLoading, client]);


  // 4. Effect to handle Category Selection Logic (UI Only)
  useEffect(() => {
    // If we are NOT typing a custom category
    if (!isCustomCategory) {
      // If the currently selected 'category' is no longer in the list (e.g. deleted), reset to first available
      if (!categories.includes(category) && categories.length > 0) {
        setCategory(categories[0]);
      } else if (categories.length === 0) {
        // If list is empty
        setCategory('');
      } else if (category === '') {
          // Initial set
          setCategory(categories[0]);
      }
    }
  }, [categories, category, isCustomCategory]);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate Totals
  const calculateStats = (data: Transaction[]) => {
    const income = data
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expense = data
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    setStats({
      income,
      expense,
      balance: income - expense
    });
  };

  // Triggered by the main file input (Manual attach)
  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const finalCategory = category.trim();

    if (!finalCategory) {
      alert("Please enter a category");
      return;
    }

    // Add new category if it's custom and not in list
    if (isCustomCategory && !categories.includes(finalCategory)) {
      setCategories(prev => [finalCategory, ...prev]); 
      // The useEffect will handle saving to Supabase automatically
    }

    try {
      setSubmitting(true);
      let slipUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await client.storage
          .from('slips')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = client.storage
          .from('slips')
          .getPublicUrl(filePath);

        slipUrl = publicUrl;
      }

      const { error: insertError } = await client
        .from('transactions')
        .insert([
          {
            amount: parseFloat(amount),
            type,
            category: finalCategory,
            description: note.trim(),
            slip_url: slipUrl,
            created_at: new Date().toISOString(),
          }
        ]);

      if (insertError) throw insertError;

      setAmount('');
      setNote('');
      setFile(null);
      if (categories.length > 0) {
        setCategory(categories[0]);
      }
      setIsCustomCategory(false);

      // Reset file inputs
      const fileInput = document.getElementById('slip-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await fetchTransactions();

    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Single
  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      const { error } = await client
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction.');
    }
  };

  // Handle Clear ALL Data
  const handleClearAll = async () => {
    if (!window.confirm(t.confirmClearAll)) return;
    
    if (!window.confirm("CONFIRMATION: Delete all data permanently?")) return;

    try {
      setLoading(true);
      const { error } = await client
        .from('transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

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

  // CSV Export
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

  // Trigger File Input for Import
  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process CSV Import
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
          const { error } = await client
            .from('transactions')
            .insert(newTransactions);
            
          if (error) throw error;
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

  // Handle Chart Download
  const handleDownloadChart = async () => {
    if (chartRef.current) {
      try {
        // Dynamically load library if missing
        if (!window.html2canvas) {
          await loadHtml2Canvas();
        }

        const canvas = await window.html2canvas(chartRef.current, {
          backgroundColor: darkMode ? '#1e293b' : '#ffffff', // Slate-800 or White
          scale: 2 // Higher resolution
        });
        
        const link = document.createElement('a');
        link.download = `expense_chart_${chartView}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error("Chart export failed", error);
        const errMsg = lang === 'th' 
          ? "ไม่สามารถโหลดระบบสร้างรูปภาพได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต" 
          : "Failed to load image generation library. Please check your internet connection.";
        alert(errMsg);
      }
    }
  };

  const handleViewSlip = (url: string) => {
    setSelectedSlip(url);
    setModalOpen(true);
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_NEW') {
      setIsCustomCategory(true);
      setCategory('');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'th' : 'en');
  };

  // Sorting Handler
  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    
    // Filter
    if (filterCategory !== 'ALL') {
      data = data.filter(t => t.category === filterCategory);
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [transactions, filterCategory, sortConfig]);

  const filteredTotal = useMemo(() => {
    if (filterCategory === 'ALL') return 0;
    return filteredTransactions.reduce((acc, curr) => {
      return acc + (curr.type === TransactionType.INCOME ? curr.amount : -curr.amount);
    }, 0);
  }, [filteredTransactions, filterCategory]);

  const availableFilterCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    categories.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [transactions, categories]);

  // Helper for Sort Icon
  const SortIcon = ({ columnKey }: { columnKey: keyof Transaction }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="opacity-30 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-500 ml-1" /> 
      : <ArrowDown size={14} className="text-blue-500 ml-1" />;
  };

  // Title Helper
  const getChartTitle = () => {
    if (chartView === 'daily') return t.chartTitle;
    if (chartView === 'monthly') return t.monthlyChartTitle;
    return t.pieChartTitle;
  }

  // Render Admin View
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
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
         />
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Header - Default Order (Top) */}
        <header className="lg:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="flex items-center gap-4">
             <div className="bg-gradient-to-tr from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-none transition-transform hover:scale-105">
               <Wallet size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{t.appTitle}</h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 dark:text-slate-400 transition-colors text-sm font-medium">{t.subTitle}</p>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-xs text-blue-500 animate-pulse bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                    <Cloud size={12} />
                    {lang === 'th' ? 'กำลังซิงค์...' : 'Syncing...'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 self-end md:self-auto">
            {/* Settings/Admin Button */}
            <button
              onClick={() => setCurrentView('admin')}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center relative"
              title={t.adminSettings}
            >
              <SettingsIcon size={18} />
              {!userName && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchTransactions();
                fetchSettings();
              }}
              disabled={loading || settingsLoading}
              className={`p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center ${loading || settingsLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              title={t.refresh}
            >
              <RefreshCw size={18} className={loading || settingsLoading ? 'animate-spin' : ''} />
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1 font-medium text-sm"
              title="Switch Language"
            >
              <Globe size={18} />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Stats Cards - Order 2 Mobile, Order 2 Desktop */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 order-2 lg:order-2">
          <StatsCard 
            title={t.totalBalance} 
            amount={stats.balance} 
            icon={Wallet} 
            type={stats.balance >= 0 ? 'success' : 'danger'} 
          />
          <StatsCard 
            title={t.totalIncome} 
            amount={stats.income} 
            icon={TrendingUp} 
            type="success" 
          />
          <StatsCard 
            title={t.totalExpense} 
            amount={stats.expense} 
            icon={TrendingDown} 
            type="danger" 
          />
        </div>

        {/* Graph Section - Order 3 Mobile, Order 3 Desktop */}
        {transactions.length > 0 && (
           <div ref={chartRef} className="lg:col-span-3 order-3 lg:order-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 self-start sm:self-auto">
                   {getChartTitle()}
                </h3>
                
                {/* Controls & Legend Container */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4 self-end sm:self-auto w-full sm:w-auto">
                  
                  {/* Download Chart Button */}
                  <button 
                    onClick={handleDownloadChart}
                    className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-slate-200 dark:border-slate-600"
                    title={t.downloadChart}
                  >
                    <Image size={16} />
                    <span className="hidden sm:inline">{t.downloadChart}</span>
                  </button>

                  {/* Toggle Switch */}
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 flex w-full sm:w-auto">
                    <button
                      onClick={() => setChartView('daily')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        chartView === 'daily' 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title={t.viewDaily}
                    >
                      <BarChart3 size={14} />
                      <span className="hidden sm:inline">{t.viewDaily}</span>
                    </button>
                    <button
                      onClick={() => setChartView('monthly')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        chartView === 'monthly' 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title={t.viewMonthly}
                    >
                      <Calendar size={14} />
                      <span className="hidden sm:inline">{t.viewMonthly}</span>
                    </button>
                    <button
                      onClick={() => setChartView('pie')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        chartView === 'pie' 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title={t.viewPie}
                    >
                      <PieChart size={14} />
                      <span className="hidden sm:inline">{t.viewPie}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              {chartView === 'daily' && (
                <>
                  <div className="flex justify-end mb-2 gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 
                      {t.income}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> 
                      {t.expense}
                    </div>
                  </div>
                  <ExpenseChart transactions={transactions} />
                </>
              )}
              
              {chartView === 'monthly' && (
                <>
                  <div className="flex justify-end mb-2 gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 
                      {t.income}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> 
                      {t.expense}
                    </div>
                  </div>
                  <MonthlyChart transactions={transactions} lang={lang} />
                </>
              )}

              {chartView === 'pie' && (
                <CategoryPieChart transactions={transactions} />
              )}
           </div>
        )}

        {/* Input Form Section - Order 1 Mobile (High Priority), Order 4 Desktop (Sidebar) */}
        <div className="lg:col-span-1 order-1 lg:order-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-8 transition-colors">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                {t.newTransaction}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Type Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${
                      type === TransactionType.INCOME 
                        ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.income}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${
                      type === TransactionType.EXPENSE 
                        ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.expense}
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.amount}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
                  {!isCustomCategory ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <select
                          value={category}
                          onChange={handleCategorySelect}
                          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                        >
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" value="" disabled>{t.selectCategory}</option>
                          {categories.map((cat) => (
                            <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" key={cat} value={cat}>{cat}</option>
                          ))}
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" disabled>──────────</option>
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" value="CUSTOM_NEW">{t.addNewCategory}</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={t.typeCategory}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory(categories.length > 0 ? categories[0] : '');
                        }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                        title="Cancel custom category"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.note}</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.notePlaceholder}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Manual File Upload (Fallback) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.slipImage}</label>
                  <div className="relative">
                    <input
                      id="slip-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleManualFileSelect}
                      className="hidden"
                    />
                    {file ? (
                        <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFile(null)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title={t.removeFile}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <label 
                        htmlFor="slip-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all text-sm text-slate-500 dark:text-slate-400"
                        >
                        <ImageIcon size={18} />
                        {t.clickToUpload}
                        </label>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      {t.saving}
                    </>
                  ) : (
                    t.saveTransaction
                  )}
                </button>
              </form>
            </div>
        </div>

        {/* History Table Section - Order 4 Mobile, Order 5 Desktop */}
        <div className="lg:col-span-2 order-4 lg:order-5">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
              
              {/* Table Header with Filter */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t.recentTransactions}</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{filteredTransactions.length} {t.items}</span>
                </div>
                
                {/* Filter and Summary Container */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                    {/* Note: Clear All Button Moved to Admin Panel */}

                    {/* Summary Badge (Shown when filtering) */}
                    {filterCategory !== 'ALL' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-800/30 shadow-sm whitespace-nowrap">
                            <span className="text-xs uppercase tracking-wide opacity-75">{t.totalFor} "{filterCategory}":</span>
                            <span className={`font-bold ${filteredTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {filteredTotal >= 0 ? '+' : ''}฿{filteredTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    
                    {/* CSV Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleExportCSV}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title={t.exportCSV}
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={triggerImport}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title={t.importCSV}
                      >
                        <Upload size={16} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportCSV} 
                        accept=".csv" 
                        className="hidden" 
                      />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <div className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 w-full shadow-sm hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                        <Filter size={16} className="text-slate-400 shrink-0" />
                        <select 
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none w-full cursor-pointer appearance-none pr-6 z-10"
                        >
                          <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" value="ALL">{t.allCategories}</option>
                          {availableFilterCategories.map(cat => (
                            <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                      <th 
                        className="p-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                        onClick={() => requestSort('created_at')}
                      >
                        <div className="flex items-center gap-1">{t.date} <SortIcon columnKey="created_at" /></div>
                      </th>
                      <th 
                        className="p-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                        onClick={() => requestSort('category')}
                      >
                         <div className="flex items-center gap-1">{t.categoryNote} <SortIcon columnKey="category" /></div>
                      </th>
                      <th 
                        className="p-4 font-medium text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                        onClick={() => requestSort('amount')}
                      >
                         <div className="flex items-center justify-end gap-1">{t.amount} <SortIcon columnKey="amount" /></div>
                      </th>
                      <th className="p-4 font-medium text-center">{t.slip}</th>
                      <th className="p-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
                          {t.loading}
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          {t.noTransactions}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                              {new Date(t.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-800 dark:text-slate-200">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                <Tag size={12} />
                                {t.category}
                              </span>
                              {t.description && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 pl-1">{t.description}</span>
                              )}
                            </div>
                          </td>
                          <td className={`p-4 text-sm font-bold text-right ${
                            t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}
                            ฿{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center">
                            {t.slip_url ? (
                              <button
                                onClick={() => handleViewSlip(t.slip_url!)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-all"
                                title="View Slip"
                              >
                                <Eye size={18} />
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                                onClick={() => handleDelete(t.id)}
                                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title={lang === 'th' ? 'ลบรายการ' : 'Delete'}
                              >
                                <Trash2 size={18} />
                              </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="lg:col-span-3 order-5 lg:order-6 text-center pt-8 pb-4 text-slate-400 dark:text-slate-500 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">
          {t.credit}
        </div>
      </div>

      <SlipModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        imageUrl={selectedSlip} 
      />
    </div>
  );
}

function App() {
  const [tempLang] = useState<Language>('en'); // Default for error screen, logic handled inside tracker
  
  if (!supabase) {
    return <ConfigError t={TRANSLATIONS[tempLang]} />;
  }
  return <ExpenseTracker />;
}

export default App;