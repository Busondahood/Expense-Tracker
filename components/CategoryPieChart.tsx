import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CategoryPieChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ef4444', // red
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);

  const data = useMemo(() => {
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    const map = new Map<string, number>();
    filtered.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries())
      .map(([name, value], index) => ({
        name, value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, type]);

  const totalAmount = data.reduce((sum, d) => sum + d.value, 0);

  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map(slice => {
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + (slice.percentage / 100);
    cumulativePercent = endPercent;
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slice.percentage > 50 ? 1 : 0;
    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    return { ...slice, pathData };
  });

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setType(TransactionType.EXPENSE)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <ArrowDown size={11} strokeWidth={3} /> Expense
          </button>
          <button onClick={() => setType(TransactionType.INCOME)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <ArrowUp size={11} strokeWidth={3} /> Income
          </button>
        </div>
      </div>

      {totalAmount === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
          <span className="text-3xl mb-3">📊</span>
          <span className="text-sm">No {type} data available to visualize.</span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-enter-card border border-slate-100 dark:border-white/5">
          <div className="relative w-44 h-44 md:w-52 md:h-52 flex-shrink-0">
            <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full transform -rotate-90">
              {slices.map((slice) => (
                <path 
                  key={slice.name}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="0.02"
                  className="hover:opacity-80 transition-opacity cursor-pointer dark:stroke-slate-900"
                >
                  <title>{`${slice.name}: ${slice.percentage.toFixed(1)}%`}</title>
                </path>
              ))}
              <circle cx="0" cy="0" r="0.6" className="fill-slate-50 dark:fill-slate-800/50" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
              <span className={`text-lg md:text-xl font-black tracking-tight ${type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                ฿{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 gap-1.5 pl-0 md:pl-4 max-h-60 overflow-y-auto custom-scrollbar">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-md flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">฿{item.value.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400 font-semibold">{item.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};