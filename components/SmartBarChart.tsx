import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

type StatsView = 'days' | 'weeks' | 'months';

interface SmartBarChartProps {
  transactions: Transaction[];
}

interface ChartItem {
  key: string;
  label: string;
  value: number;
  isCurrent: boolean;
  dateObj: Date; // Keep reference for accurate comparison
}

export const SmartBarChart: React.FC<SmartBarChartProps> = ({ transactions }) => {
  const [view, setView] = useState<StatsView>('days');
  // CHANGED: Default to INCOME
  const [showType, setShowType] = useState<TransactionType>(TransactionType.INCOME);

  // --- Date Helpers ---
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const isSameWeek = (d1: Date, d2: Date) => {
    return getStartOfWeek(d1).getTime() === getStartOfWeek(d2).getTime();
  };

  const isSameMonth = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  };

  // --- Aggregation Logic ---
  const data: ChartItem[] = useMemo(() => {
    const now = new Date();
    const skeleton: ChartItem[] = [];

    // 1. Generate Skeleton (The Buckets)
    if (view === 'days') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            d.setHours(0,0,0,0);
            skeleton.push({
                key: d.toISOString(),
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                value: 0,
                isCurrent: isSameDay(d, now),
                dateObj: d
            });
        }
    } else if (view === 'weeks') {
        // Last 5 weeks
        const currentStartOfWeek = getStartOfWeek(now);
        for (let i = 4; i >= 0; i--) {
            const d = new Date(currentStartOfWeek);
            d.setDate(d.getDate() - (i * 7));
            skeleton.push({
                key: d.toISOString(),
                label: i === 0 ? 'This Week' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                value: 0,
                isCurrent: i === 0,
                dateObj: d
            });
        }
    } else { 
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(1); // Set to 1st of month to avoid overflow issues
            d.setMonth(now.getMonth() - i);
            d.setHours(0,0,0,0);
            skeleton.push({
                key: d.toISOString(),
                label: d.toLocaleDateString('en-US', { month: 'short' }),
                value: 0,
                isCurrent: i === 0,
                dateObj: d
            });
        }
    }

    // 2. Fill Data
    transactions.forEach(t => {
        // Strict Type Check (Case insensitive just in case)
        if (t.type.toLowerCase() !== showType.toLowerCase()) return;

        try {
            const tDate = new Date(t.created_at);
            
            // Find matching bucket
            const bucket = skeleton.find(s => {
                if (view === 'days') return isSameDay(s.dateObj, tDate);
                if (view === 'weeks') return isSameWeek(s.dateObj, tDate);
                if (view === 'months') return isSameMonth(s.dateObj, tDate);
                return false;
            });

            if (bucket) {
                bucket.value += t.amount;
            }
        } catch (e) {
            console.error("Error processing transaction:", t);
        }
    });

    return skeleton;
  }, [transactions, view, showType]);

  // --- Stats ---
  const totalValue = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
  
  const previousAvg = useMemo(() => {
    const pastItems = data.slice(0, -1);
    const validItems = pastItems.filter(d => d.value > 0); // Only count active days for clearer avg
    if (validItems.length === 0) return 0;
    return validItems.reduce((acc, curr) => acc + curr.value, 0) / validItems.length;
  }, [data]);

  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? max * 1.15 : 100;
  }, [data]);

  const isExpense = showType === TransactionType.EXPENSE;

  return (
    <div className="w-full">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* Top Row: Type Toggle & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Income/Expense Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                    onClick={() => setShowType(TransactionType.EXPENSE)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                        showType === TransactionType.EXPENSE 
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#FF3B30] shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <ArrowDown size={12} strokeWidth={3} /> Expense
                </button>
                <button
                    onClick={() => setShowType(TransactionType.INCOME)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                        showType === TransactionType.INCOME 
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#34C759] shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <ArrowUp size={12} strokeWidth={3} /> Income
                </button>
            </div>

            {/* View Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                {(['days', 'weeks', 'months'] as StatsView[]).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-3 py-1.5 text-[12px] font-semibold rounded-md capitalize transition-all ${
                            view === v 
                            ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-end justify-between px-1">
             <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total {view}</div>
                <div className={`text-2xl font-bold tracking-tight ${isExpense ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                    ฿{totalValue.toLocaleString()}
                </div>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Prev. Avg</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    ฿{previousAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
             </div>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="h-[180px] w-full flex items-end justify-between gap-2 px-1 pb-2 border-b border-dashed border-gray-200 dark:border-white/10">
        {data.map((item) => {
            const heightPercent = Math.max((item.value / maxValue) * 100, 4);
            const isCurrent = item.isCurrent;
            // Dynamic Color based on Type and State
            const activeColor = isExpense ? 'bg-[#FF3B30]' : 'bg-[#34C759]';
            const barColor = isCurrent ? activeColor : 'bg-gray-200 dark:bg-gray-800';
            const labelColor = isCurrent ? 'text-black dark:text-white font-bold' : 'text-gray-400 font-medium';

            return (
                <div key={item.key} className="flex flex-col items-center flex-1 h-full justify-end group cursor-default relative">
                    
                    {/* Value Label (Top) */}
                    <div className={`text-[9px] font-bold mb-1 transition-all opacity-0 group-hover:opacity-100 ${isCurrent ? (isExpense ? 'text-[#FF3B30]' : 'text-[#34C759]') : 'text-gray-500'}`}>
                        {item.value > 0 ? (item.value >= 1000 ? (item.value/1000).toFixed(1)+'k' : item.value) : ''}
                    </div>
                    
                    {/* Bar */}
                    <div 
                        className={`w-full max-w-[28px] sm:max-w-[40px] rounded-t-[4px] transition-all duration-500 ease-spring relative ${barColor} ${isCurrent ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                        style={{ height: `${heightPercent}%` }}
                    >
                         {/* Tooltip */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-xl z-20 whitespace-nowrap">
                            ฿{item.value.toLocaleString()}
                         </div>
                    </div>
                    
                    {/* X-Axis Label */}
                    <div className={`mt-2 text-[10px] text-center truncate w-full ${labelColor}`}>
                        {item.label}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};