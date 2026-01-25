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
  Upload
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { StatsCard } from './components/StatsCard';
import { SlipModal } from './components/SlipModal';
import { ExpenseChart } from './components/ExpenseChart';
import { MonthlyChart } from './components/MonthlyChart';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats, Language, TRANSLATIONS } from './types';

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

  // Safe to assert supabase is not null here because parent checks it
  const client = supabase!;

  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [note, setNote] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // Import CSV Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Stats
  const [stats, setStats] = useState<Stats>({ balance: 0, income: 0, expense: 0 });

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data as Transaction[]);
        calculateStats(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // In a real app, use a toast here
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

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (!category.trim()) {
      alert("Please enter a category");
      return;
    }

    try {
      setSubmitting(true);
      let slipUrl = null;

      // 1. Upload Image if exists
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

      // 2. Insert Record
      const { error: insertError } = await client
        .from('transactions')
        .insert([
          {
            amount: parseFloat(amount),
            type,
            category: category.trim(),
            description: note.trim(),
            slip_url: slipUrl,
            created_at: new Date().toISOString(),
          }
        ]);

      if (insertError) throw insertError;

      // 3. Reset & Refresh
      setAmount('');
      setNote('');
      setFile(null);
      setCategory(DEFAULT_CATEGORIES[0]); 
      setIsCustomCategory(false);

      // Reset file input value manually
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

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      // In a production app, we should also delete the image from storage if it exists.
      // For this minimal version, we just delete the record.
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

  // CSV Export
  const handleExportCSV = () => {
    // Header row
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    
    // Data rows
    const rows = transactions.map(t => {
      const date = new Date(t.created_at).toISOString();
      // Escape double quotes in description and wrap in quotes
      const note = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
      return [
        date,
        t.type,
        t.category,
        t.amount,
        note
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Add Byte Order Mark (BOM) for UTF-8 so Excel opens it correctly with Thai characters
    const BOM = '\uFEFF';
    
    // Create Blob and download link
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
        
        // Skip header row and filter empty lines
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');
        
        const newTransactions = [];
        
        for (const line of dataRows) {
          // Simple CSV parse handling comma separation
          // NOTE: This basic split doesn't handle commas inside quotes perfectly.
          // For a robust app, use a library like 'papaparse'.
          // Here we assume standard format generated by our export or simple CSV.
          // Trying to handle quoted strings with regex
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
          if (matches && matches.length >= 4) {
             // Basic fallback if regex fails or matches is weird, we do standard split for simplicity in this demo
             // But let's try to map columns based on our export format:
             // Date, Type, Category, Amount, Note
             
             const cols = line.split(',');
             
             // Basic validation
             if (cols.length < 4) continue;
             
             const type = cols[1].toLowerCase().includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
             const amount = parseFloat(cols[3]);
             
             if (isNaN(amount)) continue;

             // Handle potential quotes in Note (last column)
             let note = cols.slice(4).join(','); // Rejoin remaining commas in note
             note = note.replace(/^"|"$/g, '').replace(/""/g, '"'); // Remove surrounding quotes

             newTransactions.push({
               created_at: new Date(cols[0]).toISOString(),
               type: type,
               category: cols[2],
               amount: amount,
               description: note,
               slip_url: null // We cannot import slip images via CSV easily
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
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    };

    reader.readAsText(file);
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

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'ALL') return transactions;
    return transactions.filter(t => t.category === filterCategory);
  }, [transactions, filterCategory]);

  const filteredTotal = useMemo(() => {
    if (filterCategory === 'ALL') return 0;
    return filteredTransactions.reduce((acc, curr) => {
      return acc + (curr.type === TransactionType.INCOME ? curr.amount : -curr.amount);
    }, 0);
  }, [filteredTransactions, filterCategory]);

  const availableFilterCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    DEFAULT_CATEGORIES.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [transactions]);

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
              <p className="text-slate-500 dark:text-slate-400 transition-colors text-sm font-medium">{t.subTitle}</p>
            </div>
          </div>
          
          <div className="flex gap-2 self-end md:self-auto">
            {/* Refresh Button */}
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className={`p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              title={t.refresh}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
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
           <div className="lg:col-span-3 order-3 lg:order-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 self-start sm:self-auto">
                   {chartView === 'daily' ? t.chartTitle : t.monthlyChartTitle}
                </h3>
                
                {/* Controls & Legend Container */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 self-end sm:self-auto w-full sm:w-auto">
                  
                  {/* Toggle Switch */}
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 flex w-full sm:w-auto">
                    <button
                      onClick={() => setChartView('daily')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        chartView === 'daily' 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 size={14} />
                      {t.viewDaily}
                    </button>
                    <button
                      onClick={() => setChartView('monthly')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        chartView === 'monthly' 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Calendar size={14} />
                      {t.viewMonthly}
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 
                      {t.income}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 
                      {t.expense}
                    </div>
                  </div>
                </div>
              </div>

              {chartView === 'daily' ? (
                <ExpenseChart transactions={transactions} />
              ) : (
                <MonthlyChart transactions={transactions} lang={lang} />
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
                    <div className="relative">
                      <select
                        value={category}
                        onChange={handleCategorySelect}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                      >
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" key={cat} value={cat}>{cat}</option>
                        ))}
                        <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" disabled>──────────</option>
                        <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200" value="CUSTOM_NEW">{t.addNewCategory}</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                          setCategory(DEFAULT_CATEGORIES[0]);
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

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.slipImage}</label>
                  <div className="relative">
                    <input
                      id="slip-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="slip-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all text-sm text-slate-500 dark:text-slate-400"
                    >
                      <ImageIcon size={18} />
                      {file ? file.name : t.clickToUpload}
                    </label>
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
                      <th className="p-4 font-medium">{t.date}</th>
                      <th className="p-4 font-medium">{t.categoryNote}</th>
                      <th className="p-4 font-medium text-right">{t.amount}</th>
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
                            t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'
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