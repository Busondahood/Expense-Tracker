import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  Tag as TagIcon, 
  FileText, 
  AlertTriangle, 
  X, 
  Moon, 
  Sun, 
  Trash2, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Image, 
  Settings as SettingsIcon, 
  Cloud, 
  ChevronRight, 
  Sparkles, 
  Search, 
  Scan, 
  BarChart3, 
  PieChart 
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { SlipModal } from './components/SlipModal';
import { SmartBarChart } from './components/SmartBarChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { AdminPanel } from './components/AdminPanel';
import { CustomDropdown } from './components/CustomDropdown';
import { Tag } from './components/Tag';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats, Language, TRANSLATIONS, BudgetSettings } from './types';
import { GoogleGenAI } from "@google/genai";

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

// --- Helper for Base64 ---
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
};

// --- Custom Hook for Animated Counter ---
const useAnimatedCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = countRef.current;
    startTimeRef.current = null;
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = time - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - percentage, 4); // easeOutQuart
      
      const current = startValue + (end - startValue) * ease;
      countRef.current = current;
      setCount(current);

      if (progress < duration) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [end, duration]);

  return count;
};

const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useAnimatedCounter(value);
  return <span className="tabular-nums tracking-tight">{count.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
};

const ConfigError = ({ t }: { t: typeof TRANSLATIONS['en'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black p-6 font-sans text-slate-900 dark:text-white">
    <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-enter-card">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-[#FF3B30] rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
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

  // We can safely non-null assert here because this component is only rendered if supabase exists
  const client = supabase!;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [chartView, setChartView] = useState<'timeline' | 'pie'>('timeline');
  
  const [categories, setCategories] = useState<string[]>(Array.from(DEFAULT_CATEGORIES));
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ enabled: false, limit: 10000, alertThreshold: 80 });
  const [userName, setUserName] = useState<string>('กิตติภณ สุกัญญา');
  const [glowEnabled, setGlowEnabled] = useState<boolean>(false);
  
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Critical: Prevent overwriting DB with defaults
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | null; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [note, setNote] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [formErrors, setFormErrors] = useState<{amount?: string; category?: string}>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<Stats>({ balance: 0, income: 0, expense: 0 });

  const env = (import.meta as any).env || {};
  const geminiKey = env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data, error } = await client
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        // IMPORTANT: Only set state if data exists in DB
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        if (data.budget_settings) setBudgetSettings(data.budget_settings);
        if (data.user_name) setUserName(data.user_name);
        if (data.glow_enabled !== undefined) setGlowEnabled(data.glow_enabled);
        setIsDataLoaded(true); // Mark as loaded so we can start saving updates
      } else {
        // If no row exists, we insert defaults
        const defaultSettings = {
          id: 1,
          categories: Array.from(DEFAULT_CATEGORIES),
          budget_settings: { enabled: false, limit: 10000, alertThreshold: 80 },
          user_name: 'กิตติภณ สุกัญญา',
          glow_enabled: false
        };
        const { error: insertError } = await client.from('app_settings').insert(defaultSettings);
        if (!insertError) {
             setIsDataLoaded(true); 
        }
      }
    } catch (err) {
      console.error("Unexpected error loading settings", err);
      // Do NOT set isDataLoaded(true) here, to prevent overwriting DB with defaults on error
    } finally {
      setSettingsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    // Only save if initial load is complete and successful
    if (settingsLoading || !isDataLoaded) return;
    
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
  }, [categories, budgetSettings, userName, glowEnabled, settingsLoading, isDataLoaded, client]);

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
      const { data, error } = await client.from('transactions').select('*');
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
    const income = data.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const expense = data.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    setStats({ income, expense, balance: income - expense });
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

  // --- AI SCAN LOGIC ---
  const handleScanSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!geminiKey) {
        alert("Please set VITE_GEMINI_API_KEY in .env");
        return;
    }

    try {
        setIsScanning(true);
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        const imagePart = await fileToGenerativePart(file);
        
        // Prompt for the AI
        const prompt = `
            Analyze this transaction slip image. Extract the following information in JSON format ONLY:
            {
                "amount": number (remove commas),
                "type": "income" or "expense" (if money is sent out, it is expense. if money is received, it is income. Use the user name "${userName}" to determine. If sender is ${userName}, it's expense. If receiver is ${userName}, it's income.),
                "category": string (guess the category from: ${categories.join(', ')} based on the merchant or description. If unsure, use "Other"),
                "description": string (brief description or merchant name)
            }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              imagePart,
              { text: prompt }
            ]
          }
        });

        const text = response.text;
        
        if (text) {
          // Clean markdown if present
          const jsonStr = text.replace(/```json|```/g, '').trim();
          const data = JSON.parse(jsonStr);

          if (data) {
              if (data.amount) {
                 setAmount(String(data.amount));
                 setFormErrors(prev => ({...prev, amount: undefined}));
              }
              if (data.type) setType(data.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE);
              if (data.category && categories.includes(data.category)) {
                  setCategory(data.category);
              } else if (data.category) {
                  if (!categories.includes(data.category)) {
                      setCategory('Other');
                      setNote(`${data.category} - ${data.description || ''}`);
                  } else {
                      setCategory(data.category);
                  }
              }
              if (data.description) setNote(data.description);
              setFile(file); // Set the file to upload it when saving
          }
        }

    } catch (error) {
        console.error("AI Scan Error:", error);
        alert("Failed to scan slip. Please try again or enter manually.");
    } finally {
        setIsScanning(false);
        // Reset input
        if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Robust Validation
    const newErrors: {amount?: string; category?: string} = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = t.invalidAmount;
    }
    
    const finalCategory = category.trim();
    if (!finalCategory) { 
        newErrors.category = t.categoryRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return; 
    }
    
    // Add custom category if needed
    if (isCustomCategory && !categories.includes(finalCategory)) {
      setCategories((prev: string[]) => [finalCategory, ...prev]); 
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
      setFormErrors({});
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
    // 1. Calculate Summary Stats
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    // 2. Calculate Category Breakdown
    const categoryMap = new Map<string, { type: string, amount: number }>();
    transactions.forEach(t => {
        const current = categoryMap.get(t.category) || { type: t.type, amount: 0 };
        categoryMap.set(t.category, { type: t.type, amount: current.amount + t.amount });
    });

    const csvRows = [];
    const BOM = '\uFEFF'; // Add BOM for Excel compatibility

    // --- SECTION 1: OVERALL SUMMARY ---
    csvRows.push('SUMMARY REPORT');
    csvRows.push(`Generated Date,${new Date().toLocaleDateString()}`);
    csvRows.push('');
    csvRows.push('TOTALS');
    csvRows.push(`Total Balance,${totalBalance}`);
    csvRows.push(`Total Income,${totalIncome}`);
    csvRows.push(`Total Expense,${totalExpense}`);
    csvRows.push('');

    // --- SECTION 2: CATEGORY BREAKDOWN ---
    csvRows.push('CATEGORY BREAKDOWN');
    csvRows.push('Category,Type,Total Amount');
    
    // Sort by Amount Descending
    const sortedCats = Array.from(categoryMap.entries()).sort((a, b) => b[1].amount - a[1].amount);
    
    sortedCats.forEach(([cat, data]) => {
        csvRows.push(`"${cat}",${data.type},${data.amount}`);
    });
    csvRows.push('');

    // --- SECTION 3: TRANSACTION DETAILS ---
    csvRows.push('TRANSACTION DETAILS');
    csvRows.push('Date,Type,Category,Amount,Note'); // Header for transactions
    
    transactions.forEach(t => {
      const date = new Date(t.created_at).toISOString();
      const note = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
      csvRows.push(`${date},${t.type},"${t.category}",${t.amount},${note}`);
    });

    // Create and Download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_report_${new Date().toISOString().split('T')[0]}.csv`);
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
        // Simple logic: filter out empty lines, look for lines with at least 4 commas that resemble transaction data
        // Note: This simple import might not handle the new report format well, but works for the old format/bulk data
        const dataRows = lines.filter(line => line.trim() !== '');
        
        const newTransactions = [];
        for (const line of dataRows) {
          // Skip header/summary lines by checking for "Date" header or summary keywords if mixed
          if (line.startsWith('SUMMARY') || line.startsWith('TOTALS') || line.startsWith('Category') || line.startsWith('Date')) continue;

          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (matches && matches.length >= 4) {
             const cols = line.split(',');
             // Basic validation: ensure we have columns and the 4th col is a number
             if (cols.length < 4) continue;
             const amount = parseFloat(cols[3]);
             if (isNaN(amount)) continue;

             const type = cols[1].toLowerCase().includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
             let note = cols.slice(4).join(',');
             note = note.replace(/^"|"$/g, '').replace(/""/g, '"');
             
             // Try to parse date
             let dateStr = cols[0];
             try {
                 // If invalid date, new Date throws or returns invalid
                 const d = new Date(dateStr);
                 if (isNaN(d.getTime())) dateStr = new Date().toISOString(); // Fallback
                 else dateStr = d.toISOString();
             } catch {
                 dateStr = new Date().toISOString();
             }

             newTransactions.push({
               created_at: dateStr,
               type: type,
               category: cols[2].replace(/^"|"$/g, ''), // Remove quotes from category if present
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
        
        // Wait for fonts to be loaded
        await document.fonts.ready;

        // Force a specific ID for the capture logic to work reliably with onclone
        const chartElement = chartRef.current;
        
        const canvas = await window.html2canvas(chartElement, { 
          backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', 
          scale: 3, // High resolution
          useCORS: true, 
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('[data-chart-container="true"]') as HTMLElement;
            if (clonedElement) {
                // FORCE STYLES ON CLONE to prevent layout shifts/transparency
                clonedElement.style.backgroundColor = darkMode ? '#1c1c1e' : '#ffffff';
                clonedElement.style.color = darkMode ? '#ffffff' : '#000000';
                clonedElement.style.padding = '30px'; // Add padding for screenshot
                clonedElement.style.borderRadius = '0px'; 
                
                // Fix Text Rendering in Canvas
                const allElements = clonedElement.querySelectorAll('*');
                allElements.forEach((el) => {
                    const e = el as HTMLElement;
                    e.style.fontFamily = "'Inter', sans-serif";
                    e.style.letterSpacing = "normal";
                    e.style.fontVariantLigatures = "none"; // Important for text alignment
                });
            }
          }
        });
        
        const link = document.createElement('a');
        link.download = `expense_chart.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) { 
        console.error("Chart export failed", error);
        alert("Failed to save chart."); 
      }
    }
  };

  const handleViewSlip = (url: string) => { setSelectedSlip(url); setModalOpen(true); };
  
  // Custom Dropdown Handler
  const handleCategoryChange = (val: string) => {
    if (val === 'CUSTOM_NEW') { setIsCustomCategory(true); setCategory(''); } 
    else { setIsCustomCategory(false); setCategory(val); }
    // Clear error
    if (formErrors.category) setFormErrors(prev => ({...prev, category: undefined}));
  };
  
  const toggleLanguage = () => { setLang(prev => prev === 'en' ? 'th' : 'en'); };
  
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    if (filterCategory !== 'ALL') data = data.filter(t => t.category === filterCategory);
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        data = data.filter(t => 
            t.description?.toLowerCase().includes(lowerTerm) || 
            t.category.toLowerCase().includes(lowerTerm) ||
            t.amount.toString().includes(lowerTerm)
        );
    }
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
  }, [transactions, filterCategory, sortConfig, searchTerm]);

  const availableFilterCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    categories.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [transactions, categories]);

  // Dynamic Glow Class
  const glowClass = glowEnabled 
    ? 'animate-pulse-glow border border-[#007AFF]/20' 
    : 'shadow-ios hover:shadow-lg';

  // Budget Logic
  const budgetPercent = useMemo(() => {
    if (!budgetSettings.enabled || budgetSettings.limit === 0) return 0;
    // Calculate expense for current month
    const now = new Date();
    const currentMonthExp = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .filter(t => {
            const d = new Date(t.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
    return Math.min((currentMonthExp / budgetSettings.limit) * 100, 100);
  }, [transactions, budgetSettings]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans text-slate-900 dark:text-white transition-colors duration-500 ease-smooth pb-20 overflow-x-hidden">
      
      {/* 1. Header with Glassmorphism */}
      <div className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-white/5 transition-all duration-300">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 animate-enter-list delay-0">
                <div className={`h-9 w-9 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg shadow-black/10 transition-transform hover:scale-105 duration-300 ${glowEnabled ? 'shadow-blue-500/50' : ''}`}>
                    <Wallet size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-base font-bold tracking-tight leading-none">Expense Pro</h1>
                    {isSyncing ? (
                         <span className="text-[10px] text-[#007AFF] flex items-center gap-1 font-medium animate-pulse mt-0.5"><Cloud size={10} /> Syncing</span>
                    ) : (
                         <span className="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wide">My Wallet</span>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2 animate-enter-list delay-100">
                  <button onClick={toggleLanguage} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] text-[10px] font-bold active:scale-90 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-700">{lang.toUpperCase()}</button>
                  <button onClick={() => setDarkMode(!darkMode)} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] active:scale-90 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-700">{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
                  <button onClick={() => setCurrentView('admin')} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2C2C2E] active:scale-90 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 relative">
                      <SettingsIcon size={14} />
                      {!userName && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF3B30] rounded-full border border-white dark:border-[#2C2C2E]"></span>}
                  </button>
              </div>
          </div>
      </div>

      {currentView === 'admin' ? (
          <div className="animate-enter-card">
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
        ) : (
          <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Budget Progress Bar (If Enabled) */}
              {budgetSettings.enabled && (
                  <div className="animate-enter-card delay-0">
                    <div className="flex justify-between items-end mb-2 px-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.setBudget}</span>
                        <span className={`text-[11px] font-bold ${budgetPercent > budgetSettings.alertThreshold ? 'text-red-500' : 'text-[#007AFF]'}`}>
                            {budgetPercent.toFixed(1)}% used
                        </span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-[#2C2C2E] rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-spring ${
                                budgetPercent > 90 ? 'bg-[#FF3B30]' : 
                                budgetPercent > budgetSettings.alertThreshold ? 'bg-[#FF9500]' : 
                                'bg-[#007AFF]'
                            }`} 
                            style={{ width: `${budgetPercent}%` }}
                        >
                            <div className="w-full h-full opacity-30 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]"></div>
                        </div>
                    </div>
                  </div>
              )}

              {/* Main Balance Card */}
              <div 
                className={`bg-white dark:bg-[#1C1C1E] rounded-[28px] p-6 relative overflow-hidden transition-all duration-500 ease-spring transform hover:-translate-y-1 ${glowClass} animate-enter-card delay-0`}
              >
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide opacity-80">{t.totalBalance}</span>
                        <div className="bg-[#007AFF]/10 p-1.5 rounded-full text-[#007AFF] animate-float">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    
                    <h2 className={`text-[40px] md:text-[48px] leading-tight font-bold tracking-tight mb-6 transition-all duration-300 ${glowEnabled ? 'drop-shadow-[0_0_15px_rgba(0,122,255,0.6)]' : ''}`}>
                      ฿<AnimatedCounter value={stats.balance} />
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 dark:bg-[#2C2C2E] p-4 rounded-2xl flex items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-[#3A3A3C] group cursor-default">
                          <div className="p-2 bg-[#34C759]/10 rounded-full text-[#34C759] transition-transform group-hover:scale-110 duration-300 ease-spring">
                              <ArrowUp size={16} strokeWidth={3} />
                          </div>
                          <div>
                              <div className="text-[11px] font-semibold text-gray-400 uppercase">{t.income}</div>
                              <div className="text-sm font-bold group-hover:text-[#34C759] transition-colors">฿{stats.income.toLocaleString()}</div>
                          </div>
                       </div>
                       <div className="bg-gray-50 dark:bg-[#2C2C2E] p-4 rounded-2xl flex items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-[#3A3A3C] group cursor-default">
                          <div className="p-2 bg-[#FF3B30]/10 rounded-full text-[#FF3B30] transition-transform group-hover:scale-110 duration-300 ease-spring">
                              <ArrowDown size={16} strokeWidth={3} />
                          </div>
                          <div>
                              <div className="text-[11px] font-semibold text-gray-400 uppercase">{t.expense}</div>
                              <div className="text-sm font-bold group-hover:text-[#FF3B30] transition-colors">฿{stats.expense.toLocaleString()}</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Input Group */}
              <div className="animate-enter-card delay-100">
                 <div className="flex justify-between items-center mb-2 ml-4 mr-1">
                     <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.newTransaction}</h3>
                     {/* AI SCAN BUTTON */}
                     <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleScanSlip} 
                            ref={scanInputRef}
                            className="hidden" 
                            id="ai-scan"
                        />
                        <label 
                            htmlFor="ai-scan"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-300 ${
                                isScanning 
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5'
                            }`}
                        >
                            {isScanning ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Sparkles size={12} fill="currentColor" />
                            )}
                            {isScanning ? t.analyzing : t.scanSlip}
                        </label>
                     </div>
                 </div>
                 
                 {/* REMOVED overflow-hidden from here to let dropdown expand */}
                 <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] ${glowClass} transition-transform duration-300 hover:scale-[1.005]`}>
                     
                     <div className="p-4 border-b border-gray-100 dark:border-[#2C2C2E] rounded-t-[24px]">
                        <div className="relative bg-[#767680]/10 dark:bg-[#767680]/20 rounded-[12px] p-1 flex h-10">
                            {[TransactionType.EXPENSE, TransactionType.INCOME].map((tabType) => (
                              <button 
                                key={tabType}
                                type="button"
                                onClick={() => setType(tabType)}
                                className={`relative z-10 flex-1 text-[13px] font-semibold transition-all duration-300 ease-spring rounded-[10px] ${
                                    type === tabType 
                                    ? 'bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm scale-100' 
                                    : 'text-gray-500 scale-95 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                {tabType === TransactionType.EXPENSE ? t.expense : t.income}
                              </button>
                            ))}
                        </div>
                     </div>

                     <form onSubmit={handleSubmit}>
                        <div className="p-6 flex flex-col items-center justify-center relative">
                            <span className="text-xs text-gray-400 font-medium mb-1 tracking-wide">{t.amount}</span>
                            <div className="flex items-baseline gap-1 transform transition-transform duration-300 focus-within:scale-110">
                                <span className="text-3xl font-light text-gray-400">฿</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (formErrors.amount) setFormErrors(prev => ({...prev, amount: undefined}));
                                    }}
                                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                                    placeholder="0"
                                    className="bg-transparent text-center text-[56px] font-semibold outline-none w-full max-w-[240px] placeholder:text-gray-200 dark:placeholder:text-gray-800 caret-[#007AFF] p-0 m-0 leading-tight transition-colors"
                                    step="0.01"
                                    min="0.01"
                                    required
                                />
                            </div>
                            {formErrors.amount && (
                                <span className="absolute bottom-1 text-[10px] text-[#FF3B30] font-medium animate-enter-list">
                                    {formErrors.amount}
                                </span>
                            )}
                        </div>

                        <div className="px-4 pb-4">
                            {/* REMOVED overflow-hidden from here too */}
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-[18px] transition-all">
                                {/* Category - Replaced with CustomDropdown */}
                                <div className={`flex items-center px-4 py-3.5 border-b border-gray-300/50 dark:border-white/5 transition-colors rounded-t-[18px] ${formErrors.category ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                    <div className="p-1.5 bg-[#007AFF] rounded-[8px] mr-3 shadow-sm">
                                        <TagIcon size={16} className="text-white" strokeWidth={2.5} />
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
                                                    onChange={(e) => {
                                                        setCategory(e.target.value);
                                                        if (formErrors.category) setFormErrors(prev => ({...prev, category: undefined}));
                                                    }}
                                                    placeholder="New category..."
                                                    className="bg-transparent w-full outline-none text-[15px] font-medium placeholder:font-normal"
                                                    autoFocus
                                                />
                                                <button onClick={() => setIsCustomCategory(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="flex items-center px-4 py-3.5 border-b border-gray-300/50 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="p-1.5 bg-[#FF9500] rounded-[8px] mr-3 shadow-sm">
                                        <FileText size={16} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <input 
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder={t.note}
                                        className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-gray-400 font-medium placeholder:font-normal"
                                    />
                                </div>

                                {/* Slip */}
                                <div className="flex items-center px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group rounded-b-[18px]">
                                    <div className="p-1.5 bg-[#AF52DE] rounded-[8px] mr-3 shadow-sm">
                                        <ImageIcon size={16} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <input id="slip" type="file" accept="image/*" onChange={handleManualFileSelect} className="hidden" />
                                    <label htmlFor="slip" className="flex-1 flex items-center justify-between cursor-pointer">
                                        <span className={`text-[15px] transition-colors ${file ? 'text-[#007AFF] font-medium' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                            {file ? file.name : t.slipImage}
                                        </span>
                                        {file && <button onClick={(e) => {e.preventDefault(); setFile(null)}}><X size={18} className="text-gray-400 hover:text-red-500 transition-colors"/></button>}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-4">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className={`w-full bg-[#007AFF] hover:bg-[#0062c4] active:scale-[0.98] text-white font-semibold text-[17px] py-3.5 rounded-[16px] transition-all duration-300 ease-spring disabled:opacity-50 flex items-center justify-center gap-2 ${glowEnabled ? 'shadow-[0_0_25px_rgba(0,122,255,0.6)]' : 'shadow-lg shadow-blue-500/20'}`}
                            >
                                {submitting ? <Loader2 className="animate-spin"/> : t.saveTransaction}
                            </button>
                        </div>
                     </form>
                 </div>
              </div>

              {/* Charts Widget (Replaced) */}
              <div className="animate-enter-card delay-200">
                <h3 className="ml-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Analytics</h3>
                <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 ${glowClass}`} ref={chartRef} data-chart-container="true">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex bg-[#767680]/10 dark:bg-[#767680]/20 p-0.5 rounded-[10px]">
                            <button onClick={() => setChartView('timeline')} className={`px-3 py-1.5 text-[13px] font-medium rounded-[8px] flex items-center gap-2 transition-all duration-300 ease-spring ${chartView === 'timeline' ? 'bg-white dark:bg-[#636366] shadow-sm text-black dark:text-white scale-100' : 'text-gray-500 scale-95 hover:text-gray-700'}`}>
                                <BarChart3 size={14} /> Timeline
                            </button>
                            <button onClick={() => setChartView('pie')} className={`px-3 py-1.5 text-[13px] font-medium rounded-[8px] flex items-center gap-2 transition-all duration-300 ease-spring ${chartView === 'pie' ? 'bg-white dark:bg-[#636366] shadow-sm text-black dark:text-white scale-100' : 'text-gray-500 scale-95 hover:text-gray-700'}`}>
                                <PieChart size={14} /> Categories
                            </button>
                        </div>
                        <button onClick={handleDownloadChart} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-[#2C2C2E] rounded-full text-[#007AFF] active:scale-90 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"><Image size={16}/></button>
                    </div>
                    {chartView === 'timeline' && <SmartBarChart transactions={transactions} />}
                    {chartView === 'pie' && <CategoryPieChart transactions={transactions} />}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-5 animate-enter-list delay-300">
               <div>
                  <div className="flex items-center justify-between mb-4 ml-4 mr-2">
                     <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.recentTransactions}</h3>
                     <div className="flex items-center gap-2">
                        <button onClick={() => fetchTransactions()} className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-all active:rotate-180 duration-500 ${loading ? 'animate-spin text-[#007AFF]' : 'text-gray-400'}`}><RefreshCw size={14}/></button>
                        
                        <div className="flex gap-2">
                            <button onClick={handleExportCSV} className="text-[#007AFF] text-[13px] font-medium active:opacity-50 transition-opacity">{t.exportCSV}</button>
                            <button onClick={triggerImport} className="text-[#007AFF] text-[13px] font-medium active:opacity-50 transition-opacity">{t.importCSV}</button>
                        </div>
                     </div>
                  </div>

                  {/* Search Bar (New) */}
                  <div className="mb-3 px-4">
                     <div className="relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                             <Search size={14} />
                         </div>
                         <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search note, amount, category..."
                            className="w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white text-[13px] py-2.5 pl-9 pr-4 rounded-[12px] outline-none shadow-sm focus:ring-2 focus:ring-[#007AFF]/20 transition-all placeholder:text-gray-400"
                         />
                         {searchTerm && (
                             <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                 <X size={12} />
                             </button>
                         )}
                     </div>
                  </div>

                  {/* Filter - REPLACED WITH CUSTOM DROPDOWN */}
                  <div className="mb-4 px-4 relative z-20">
                      <div className="relative group">
                          <CustomDropdown
                            options={['ALL', ...availableFilterCategories]}
                            value={filterCategory === 'ALL' ? t.allCategories : filterCategory}
                            onChange={(val) => setFilterCategory(val === t.allCategories ? 'ALL' : val)}
                            placeholder={t.filterByCategory}
                            allowAdd={false}
                          />
                      </div>
                  </div>

                  <div className={`bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden min-h-[400px] ${glowClass}`}>
                      <div className="overflow-y-auto max-h-[800px] custom-scrollbar p-2">
                          {loading ? (
                              <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
                                  <Loader2 className="animate-spin mb-2" />
                                  <span className="text-xs">{t.loading}</span>
                              </div>
                          ) : filteredTransactions.length === 0 ? (
                              <div className="text-center py-20 text-gray-400 text-sm animate-scale-in">{t.noTransactions}</div>
                          ) : (
                              <div className="space-y-1">
                                    {filteredTransactions.map((t, index) => (
                                    <div 
                                      key={t.id}
                                      className="group flex items-center justify-between p-3 rounded-[16px] hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-all duration-300 ease-spring cursor-default relative animate-enter-list hover:scale-[1.02] hover:shadow-sm"
                                      style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Dot with Glow */}
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 ${
                                                t.type === TransactionType.INCOME 
                                                ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]' 
                                                : 'bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.5)]'
                                            }`}></div>
                                            
                                            <div>
                                                {/* REPLACED CATEGORY TEXT WITH TAG */}
                                                <Tag>{t.category}</Tag>
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
                                                    <div onClick={(e) => { e.stopPropagation(); handleViewSlip(t.slip_url!)}} className="flex items-center justify-end gap-1 text-[11px] text-[#007AFF] cursor-pointer mt-0.5 hover:underline opacity-80 hover:opacity-100">
                                                        <Eye size={10} /> View Slip
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="text-gray-300 hover:text-[#FF3B30] p-1.5 rounded-full transition-colors active:scale-90 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]"
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
        )}

      <SlipModal isOpen={modalOpen} onClose={() => setModalOpen(false)} imageUrl={selectedSlip} />
    </div>
  );
}

// Wrapper App Component for Global Error Handling
function App() {
  if (!supabase) {
    return <ConfigError t={TRANSLATIONS['en']} />;
  }
  return <ExpenseTracker />;
}

export default App;