import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats, Language, TRANSLATIONS, BudgetSettings, PendingTransaction } from '../types';
import OpenAI from 'openai';

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const compressImageBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
      }
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64Data = compressedDataUrl.split(',')[1];
      resolve(base64Data);
    };
    img.onerror = (error) => reject(error);
  });
};

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

export function useExpenseTracker() {
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [chartView, setChartView] = useState<'timeline' | 'pie'>('timeline');
  const [categories, setCategories] = useState<string[]>(Array.from(DEFAULT_CATEGORIES));
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ enabled: false, limit: 10000, alertThreshold: 80 });
  const [userName, setUserName] = useState<string>('กิตติภณ สุกัญญา');
  const [glowEnabled, setGlowEnabled] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
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
  
  // Multi-scan states
  const [pendingScans, setPendingScans] = useState<PendingTransaction[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isConfirmingScans, setIsConfirmingScans] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Refs to track latest settings values for reliable saves
  const settingsRef = useRef({ categories, budgetSettings, userName, glowEnabled });
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDataLoadedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    settingsRef.current = { categories, budgetSettings, userName, glowEnabled };
  }, [categories, budgetSettings, userName, glowEnabled]);

  useEffect(() => {
    isDataLoadedRef.current = isDataLoaded;
  }, [isDataLoaded]);

  const [stats, setStats] = useState<Stats>({ balance: 0, income: 0, expense: 0 });

  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY || (typeof process !== 'undefined' ? process.env?.VITE_OPENAI_API_KEY : undefined);

  // --- Core save function (uses refs for latest values) ---
  const doSaveSettings = useCallback(async (settingsToSave?: typeof settingsRef.current) => {
    if (!isDataLoadedRef.current) return;
    const s = settingsToSave || settingsRef.current;
    setIsSyncing(true);
    try {
      const { error } = await client.from('app_settings').upsert({
        id: 1,
        categories: s.categories,
        budget_settings: { ...s.budgetSettings, glowEnabled: s.glowEnabled },
        user_name: s.userName,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error("Error syncing settings:", error);
      }
    } catch (err) {
      console.error("Error syncing settings:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [client]);

  // --- Immediate save (for critical actions like category add/delete, view switch) ---
  const saveSettingsNow = useCallback(async () => {
    // Cancel any pending debounced save
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
    await doSaveSettings();
  }, [doSaveSettings]);

  // --- Settings ---
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data, error } = await client
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        if (data.budget_settings) {
          const bs = data.budget_settings;
          setBudgetSettings({ enabled: bs.enabled ?? false, limit: bs.limit ?? 10000, alertThreshold: bs.alertThreshold ?? 80 });
          if (bs.glowEnabled !== undefined) setGlowEnabled(bs.glowEnabled);
        }
        if (data.user_name) setUserName(data.user_name);
        setIsDataLoaded(true);
      } else {
        const defaultSettings = {
          id: 1,
          categories: Array.from(DEFAULT_CATEGORIES),
          budget_settings: { enabled: false, limit: 10000, alertThreshold: 80, glowEnabled: false },
          user_name: 'กิตติภณ สุกัญญา'
        };
        const { error: insertError } = await client.from('app_settings').insert(defaultSettings);
        if (!insertError) setIsDataLoaded(true);
      }
    } catch (err) {
      console.error("Unexpected error loading settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // --- Debounced auto-save (for non-critical changes like typing userName) ---
  useEffect(() => {
    if (settingsLoading || !isDataLoaded) return;
    // Cancel previous pending save
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
    }
    pendingSaveRef.current = setTimeout(() => {
      doSaveSettings();
      pendingSaveRef.current = null;
    }, 800);
    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
      }
    };
  }, [categories, budgetSettings, userName, glowEnabled, settingsLoading, isDataLoaded, doSaveSettings]);

  // --- Protect against page close (flush pending saves) ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current && isDataLoadedRef.current) {
        // Attempt save before page closes
        doSaveSettings();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [doSaveSettings]);

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

  // --- Transactions ---
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

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const calculateStats = (data: Transaction[]) => {
    const income = data.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const expense = data.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    setStats({ income, expense, balance: income - expense });
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

  // --- AI Scan ---
  const handleScanSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!openAIApiKey) { alert("Please set VITE_OPENAI_API_KEY in .env.local"); return; }
    
    setIsScanning(true);
    const newPendingScans: PendingTransaction[] = [];
    
    // Create an array of promises to process files in block
    const scanPromises = Array.from(files).map(async (file) => {
        try {
            const openai = new OpenAI({
              baseURL: 'https://gen.ai.kku.ac.th/api/v1',
              apiKey: openAIApiKey,
              dangerouslyAllowBrowser: true, 
            });

            const base64Data = await compressImageBase64(file);
            const imageUrl = `data:image/jpeg;base64,${base64Data}`;
            const previewUrl = URL.createObjectURL(file);

            const prompt = `
                Analyze this transaction slip image. Extract the following information in JSON format ONLY:
                {
                    "amount": number (remove commas),
                    "type": "income" or "expense" (if money is sent out, it is expense. if money is received, it is income. Use the user name "${userName}" to determine. If sender name exactly matches "${userName}", it's expense. If receiver name exactly matches "${userName}", it's income. Prioritize this rule.),
                    "category": string (You MUST choose EXACTLY ONE from this list: [${categories.join(', ')}, "Other"]. Do not invent any new category names. IMPORTANT RULE: If type is "income" and amount is EXACTLY 250, then category MUST be exactly "Work"),
                    "description": string (brief description or merchant name. IMPORTANT RULE: If type is "income" and amount is EXACTLY 250, then description MUST be "ลงโปรแกรม")
                }
            `;

            const completion = await openai.chat.completions.create({
              messages: [
                {"role": "system", "content": "You are a helpful assistant skilled at parsing financial transaction slips. Always output raw JSON and respect the sender/receiver name rules."},
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageUrl,
                      },
                    },
                  ],
                }
              ],
              model: "gemini-2.5-flash",
              stream: false
            });

            const text = completion.choices[0]?.message?.content;
            
            if (text) {
              const jsonStr = text.replace(/```json|```/g, '').trim();
              const data = JSON.parse(jsonStr);
              if (data) {
                  let finalType = data.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
                  
                  let finalCategory = 'Other';
                  if (data.category && typeof data.category === 'string') {
                    // Try to find exact match ignoring case
                    const matchedCat = categories.find(c => c.toLowerCase() === data.category.toLowerCase());
                    if (matchedCat) {
                       finalCategory = matchedCat;
                    } else if (data.category.toLowerCase() === 'work') {
                       finalCategory = 'Work';
                    }
                  }

                  let finalDescription = data.description || '';

                  if (finalType === TransactionType.INCOME && Number(data.amount) === 250) {
                      finalCategory = 'Work';
                      finalDescription = 'ลงโปรแกรม';
                  }

                  newPendingScans.push({
                      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
                      amount: Number(data.amount) || 0,
                      type: finalType,
                      category: finalCategory,
                      description: finalDescription,
                      file: file,
                      previewUrl: previewUrl,
                      status: 'pending',
                      originalFileName: file.name
                  });
              }
            }
        } catch (error) {
            console.error(`AI Scan Error for file ${file.name}:`, error);
            // Optionally, we could add it to pending scans with an error state
        }
    });

    await Promise.all(scanPromises);
    
    setIsScanning(false);
    if (scanInputRef.current) scanInputRef.current.value = '';
    
    if (newPendingScans.length > 0) {
        setPendingScans(newPendingScans);
        setIsReviewModalOpen(true);
    } else {
        alert("Failed to scan any slips. Please try again or enter manually.");
    }
  };

  const handleConfirmScans = async () => {
    setIsConfirmingScans(true);
    let addedNewCategory = false;
    let allCategories = [...categories];

    const processingPromises = pendingScans.map(async (scan) => {
      try {
        if (!allCategories.includes(scan.category)) {
            allCategories.push(scan.category);
            addedNewCategory = true;
        }

        let slipUrl = null;
        if (scan.file) {
          const fileExt = scan.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await client.storage.from('slips').upload(fileName, scan.file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = client.storage.from('slips').getPublicUrl(fileName);
          slipUrl = publicUrl;
        }

        const { error: insertError } = await client.from('transactions').insert([{
            amount: scan.amount, 
            type: scan.type, 
            category: scan.category,
            description: scan.description.trim(), 
            slip_url: slipUrl, 
            created_at: new Date().toISOString(),
        }]);

        if (insertError) throw insertError;

        setPendingScans(prev => prev.map(p => p.id === scan.id ? { ...p, status: 'saved' } : p));
      } catch (err) {
        console.error("Error saving batched transaction", err);
        setPendingScans(prev => prev.map(p => p.id === scan.id ? { ...p, status: 'error', error: 'Failed to upload' } : p));
      }
    });

    await Promise.all(processingPromises);
    
    if (addedNewCategory) {
        setCategories(allCategories);
        setTimeout(() => saveSettingsNow(), 50);
    }

    await fetchTransactions(true);
    setIsConfirmingScans(false);
    
    // Close modal after a short delay so they can see success state
    setTimeout(() => {
        setIsReviewModalOpen(false);
        setPendingScans([]);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {amount?: string; category?: string} = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) newErrors.amount = t.invalidAmount;
    const finalCategory = category.trim();
    if (!finalCategory) newErrors.category = t.categoryRequired;
    if (Object.keys(newErrors).length > 0) { setFormErrors(newErrors); return; }
    // Track if we added a new category to trigger immediate save
    let addedNewCategory = false;
    if (isCustomCategory && !categories.includes(finalCategory)) {
      setCategories((prev: string[]) => [finalCategory, ...prev]); 
      addedNewCategory = true;
    }
    try {
      setSubmitting(true);
      let slipUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await client.storage.from('slips').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = client.storage.from('slips').getPublicUrl(fileName);
        slipUrl = publicUrl;
      }
      const { error: insertError } = await client.from('transactions').insert([{
            amount: parseFloat(amount), type, category: finalCategory,
            description: note.trim(), slip_url: slipUrl, created_at: new Date().toISOString(),
          }]);
      if (insertError) throw insertError;
      setAmount(''); setNote(''); setFile(null); setFormErrors({});
      if (categories.length > 0) setCategory(categories[0]);
      setIsCustomCategory(false);
      const fileInput = document.getElementById('slip-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchTransactions(true);
      // Immediately save settings if we added a new category
      if (addedNewCategory) {
        // Need a microtask delay so React state has updated the ref
        setTimeout(() => saveSettingsNow(), 50);
      }
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
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;
    const categoryMap = new Map<string, { type: string, amount: number }>();
    transactions.forEach(t => {
        const current = categoryMap.get(t.category) || { type: t.type, amount: 0 };
        categoryMap.set(t.category, { type: t.type, amount: current.amount + t.amount });
    });
    const csvRows = [];
    const BOM = '\uFEFF';
    csvRows.push('SUMMARY REPORT');
    csvRows.push(`Generated Date,${new Date().toLocaleDateString()}`);
    csvRows.push('');
    csvRows.push('TOTALS');
    csvRows.push(`Total Balance,${totalBalance}`);
    csvRows.push(`Total Income,${totalIncome}`);
    csvRows.push(`Total Expense,${totalExpense}`);
    csvRows.push('');
    csvRows.push('CATEGORY BREAKDOWN');
    csvRows.push('Category,Type,Total Amount');
    const sortedCats = Array.from(categoryMap.entries()).sort((a, b) => b[1].amount - a[1].amount);
    sortedCats.forEach(([cat, data]) => { csvRows.push(`"${cat}",${data.type},${data.amount}`); });
    csvRows.push('');
    csvRows.push('TRANSACTION DETAILS');
    csvRows.push('Date,Type,Category,Amount,Note');
    transactions.forEach(t => {
      const date = new Date(t.created_at).toISOString();
      const note = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
      csvRows.push(`${date},${t.type},"${t.category}",${t.amount},${note}`);
    });
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
        const dataRows = lines.filter(line => line.trim() !== '');
        const newTransactions = [];
        for (const line of dataRows) {
          if (line.startsWith('SUMMARY') || line.startsWith('TOTALS') || line.startsWith('Category') || line.startsWith('Date')) continue;
          const matches = line.match(/(\".*?\"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (matches && matches.length >= 4) {
             const cols = line.split(',');
             if (cols.length < 4) continue;
             const amount = parseFloat(cols[3]);
             if (isNaN(amount)) continue;
             const type = cols[1].toLowerCase().includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
             let note = cols.slice(4).join(',');
             note = note.replace(/^"|"$/g, '').replace(/""/g, '"');
             let dateStr = cols[0];
             try {
                 const d = new Date(dateStr);
                 if (isNaN(d.getTime())) dateStr = new Date().toISOString();
                 else dateStr = d.toISOString();
             } catch { dateStr = new Date().toISOString(); }
             newTransactions.push({
               created_at: dateStr, type: type, category: cols[2].replace(/^"|"$/g, ''),
               amount: amount, description: note, slip_url: null 
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
        await document.fonts.ready;
        const chartElement = chartRef.current;
        const canvas = await window.html2canvas(chartElement, { 
          backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', 
          scale: 3, useCORS: true, logging: false,
          onclone: (clonedDoc: Document) => {
            const clonedElement = clonedDoc.querySelector('[data-chart-container="true"]') as HTMLElement;
            if (clonedElement) {
                clonedElement.style.backgroundColor = darkMode ? '#1c1c1e' : '#ffffff';
                clonedElement.style.color = darkMode ? '#ffffff' : '#000000';
                clonedElement.style.padding = '30px';
                clonedElement.style.borderRadius = '0px'; 
                const allElements = clonedElement.querySelectorAll('*');
                allElements.forEach((el) => {
                    const e = el as HTMLElement;
                    e.style.fontFamily = "'Inter', sans-serif";
                    e.style.letterSpacing = "normal";
                    e.style.fontVariantLigatures = "none";
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
  
  const handleCategoryChange = (val: string) => {
    if (val === 'CUSTOM_NEW') { setIsCustomCategory(true); setCategory(''); } 
    else { setIsCustomCategory(false); setCategory(val); }
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

  const budgetPercent = useMemo(() => {
    if (!budgetSettings.enabled || budgetSettings.limit === 0) return 0;
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

  return {
    // State
    darkMode, setDarkMode,
    lang, t, toggleLanguage,
    currentView, setCurrentView,
    transactions, loading, submitting,
    filterCategory, setFilterCategory,
    searchTerm, setSearchTerm,
    chartView, setChartView,
    categories, setCategories,
    budgetSettings, setBudgetSettings,
    userName, setUserName,
    glowEnabled, setGlowEnabled,
    isSyncing, isScanning,
    modalOpen, setModalOpen,
    selectedSlip, setSelectedSlip,
    amount, setAmount,
    type, setType,
    category, setCategory,
    isCustomCategory, setIsCustomCategory,
    note, setNote,
    file, setFile,
    formErrors, setFormErrors,
    stats, budgetPercent,
    filteredTransactions,
    availableFilterCategories,
    // Refs
    fileInputRef, scanInputRef, chartRef,
    // Review Modal State
    pendingScans, setPendingScans,
    isReviewModalOpen, setIsReviewModalOpen,
    isConfirmingScans, handleConfirmScans,
    
    // Handlers
    handleSubmit, handleDelete, handleClearAll,
    handleExportCSV, handleImportCSV, triggerImport,
    handleDownloadChart, handleViewSlip,
    handleCategoryChange, handleManualFileSelect,
    handleScanSlip, fetchTransactions,
    saveSettingsNow,
  };
}
