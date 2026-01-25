import React, { useState, useEffect, useCallback } from 'react';
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
  X
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { StatsCard } from './components/StatsCard';
import { SlipModal } from './components/SlipModal';
import { ExpenseChart } from './components/ExpenseChart';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Stats } from './types';

// Component to show when Supabase is not configured
const ConfigError = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center border border-slate-100">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-3">Connection Required</h2>
      <p className="text-slate-500 mb-6 leading-relaxed">
        To use the Expense Tracker, you need to connect it to a Supabase project. 
        Please configure your environment variables.
      </p>
      
      <div className="text-left bg-slate-900 rounded-lg p-4 mb-6 overflow-x-auto shadow-inner">
        <code className="text-xs font-mono text-green-400 block mb-2"># .env</code>
        <div className="text-xs font-mono text-slate-300 space-y-1">
          <div><span className="text-purple-400">VITE_SUPABASE_URL</span>=https://your-project.supabase.co</div>
          <div><span className="text-purple-400">VITE_SUPABASE_ANON_KEY</span>=your-anon-key</div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        See <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">SUPABASE_SETUP.md</code> for setup instructions.
      </p>
    </div>
  </div>
);

function ExpenseTracker() {
  // Safe to assert supabase is not null here because parent checks it
  const client = supabase!;

  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
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
      // Reset custom category logic for better UX, default back to 'Food' or keep custom? 
      // Let's reset to default to be clean.
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Expense Tracker Pro</h1>
          <p className="text-slate-500">Manage your personal finances and keep track of slips.</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Balance" 
            amount={stats.balance} 
            icon={Wallet} 
            type={stats.balance >= 0 ? 'success' : 'danger'} 
          />
          <StatsCard 
            title="Total Income" 
            amount={stats.income} 
            icon={TrendingUp} 
            type="success" 
          />
          <StatsCard 
            title="Total Expense" 
            amount={stats.expense} 
            icon={TrendingDown} 
            type="danger" 
          />
        </div>

        {/* Graph Section */}
        {transactions.length > 0 && (
           <ExpenseChart transactions={transactions} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Input Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                New Transaction
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Type Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${
                      type === TransactionType.INCOME 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${
                      type === TransactionType.EXPENSE 
                        ? 'bg-white text-red-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Expense
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  {!isCustomCategory ? (
                    <select
                      value={category}
                      onChange={handleCategorySelect}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option disabled>──────────</option>
                      <option value="CUSTOM_NEW">+ Add New Category</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Type category name..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory(DEFAULT_CATEGORIES[0]);
                        }}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Cancel custom category"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What was this for?"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slip Image (Optional)</label>
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
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all text-sm text-slate-500"
                    >
                      <ImageIcon size={18} />
                      {file ? file.name : "Click to upload slip"}
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* History Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Recent Transactions</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{transactions.length} items</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Category / Note</th>
                      <th className="p-4 font-medium text-right">Amount</th>
                      <th className="p-4 font-medium text-center">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
                          Loading data...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No transactions found. Start by adding one!
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(t.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-800">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Tag size={12} />
                                {t.category}
                              </span>
                              {t.description && (
                                <span className="text-xs text-slate-500 pl-1">{t.description}</span>
                              )}
                            </div>
                          </td>
                          <td className={`p-4 text-sm font-bold text-right ${
                            t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-800'
                          }`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}
                            ฿{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center">
                            {t.slip_url ? (
                              <button
                                onClick={() => handleViewSlip(t.slip_url!)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-full transition-all"
                                title="View Slip"
                              >
                                <Eye size={18} />
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
  if (!supabase) {
    return <ConfigError />;
  }
  return <ExpenseTracker />;
}

export default App;
