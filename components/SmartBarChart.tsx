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
  dateObj: Date;
}

export const SmartBarChart: React.FC<SmartBarChartProps> = ({ transactions }) => {
  const [view, setView] = useState<StatsView>('days');
  const [showType, setShowType] = useState<TransactionType>(TransactionType.INCOME);

  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  const isSameWeek = (d1: Date, d2: Date) => getStartOfWeek(d1).getTime() === getStartOfWeek(d2).getTime();
  const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

  const data: ChartItem[] = useMemo(() => {
    const now = new Date();
    const skeleton: ChartItem[] = [];

    if (view === 'days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
        skeleton.push({ key: d.toISOString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: 0, isCurrent: isSameDay(d, now), dateObj: d });
      }
    } else if (view === 'weeks') {
      const currentStartOfWeek = getStartOfWeek(now);
      for (let i = 4; i >= 0; i--) {
        const d = new Date(currentStartOfWeek); d.setDate(d.getDate() - (i * 7));
        skeleton.push({ key: d.toISOString(), label: i === 0 ? 'This Week' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), value: 0, isCurrent: i === 0, dateObj: d });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(now.getMonth() - i); d.setHours(0,0,0,0);
        skeleton.push({ key: d.toISOString(), label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0, isCurrent: i === 0, dateObj: d });
      }
    }

    transactions.forEach(t => {
      if (t.type.toLowerCase() !== showType.toLowerCase()) return;
      try {
        const tDate = new Date(t.created_at);
        const bucket = skeleton.find(s => {
          if (view === 'days') return isSameDay(s.dateObj, tDate);
          if (view === 'weeks') return isSameWeek(s.dateObj, tDate);
          if (view === 'months') return isSameMonth(s.dateObj, tDate);
          return false;
        });
        if (bucket) bucket.value += t.amount;
      } catch (e) { console.error("Error processing transaction:", t); }
    });
    return skeleton;
  }, [transactions, view, showType]);

  const totalValue = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
  const previousAvg = useMemo(() => {
    const pastItems = data.slice(0, -1);
    const validItems = pastItems.filter(d => d.value > 0);
    if (validItems.length === 0) return 0;
    return validItems.reduce((acc, curr) => acc + curr.value, 0) / validItems.length;
  }, [data]);
  const maxValue = useMemo(() => { const max = Math.max(...data.map(d => d.value)); return max > 0 ? max * 1.15 : 100; }, [data]);
  const isExpense = showType === TransactionType.EXPENSE;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setShowType(TransactionType.EXPENSE)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${showType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <ArrowDown size={11} strokeWidth={3} /> Expense
            </button>
            <button onClick={() => setShowType(TransactionType.INCOME)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${showType === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <ArrowUp size={11} strokeWidth={3} /> Income
            </button>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['days', 'weeks', 'months'] as StatsView[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${view === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between px-1">
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total {view}</div>
            <div className={`text-2xl font-black tracking-tight ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
              ฿{totalValue.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Prev. Avg</div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
              ฿{previousAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[180px] w-full flex items-end justify-between gap-2 px-1 pb-2 border-b border-dashed border-slate-200 dark:border-white/5">
        {data.map((item) => {
          const heightPercent = Math.max((item.value / maxValue) * 100, 4);
          const isCurrent = item.isCurrent;
          const activeGradient = isExpense 
            ? 'bg-gradient-to-t from-rose-500 to-rose-400' 
            : 'bg-gradient-to-t from-emerald-500 to-emerald-400';
          const barColor = isCurrent ? activeGradient : 'bg-slate-200 dark:bg-slate-800';

          return (
            <div key={item.key} className="flex flex-col items-center flex-1 h-full justify-end group cursor-default relative">
              <div className={`text-[8px] font-bold mb-1 transition-all opacity-0 group-hover:opacity-100 ${isCurrent ? (isExpense ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-500'}`}>
                {item.value > 0 ? (item.value >= 1000 ? (item.value/1000).toFixed(1)+'k' : item.value) : ''}
              </div>
              <div 
                className={`w-full max-w-[28px] sm:max-w-[40px] rounded-t-lg transition-all duration-500 ease-spring relative ${barColor} ${isCurrent ? 'opacity-100 shadow-sm' : 'opacity-60 group-hover:opacity-100'}`}
                style={{ height: `${heightPercent}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg shadow-xl z-20 whitespace-nowrap">
                  ฿{item.value.toLocaleString()}
                </div>
              </div>
              <div className={`mt-2 text-[9px] text-center truncate w-full font-medium ${isCurrent ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}`}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};