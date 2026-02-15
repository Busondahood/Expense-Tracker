import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CategoryPieChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
  '#6366f1', // indigo
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions }) => {
  // Add state to toggle between Income and Expense, default to INCOME
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);

  const data = useMemo(() => {
    // Filter based on the selected type
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    
    const map = new Map<string, number>();
    filtered.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });

    return Array.from(map.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort biggest first
  }, [transactions, type]);

  const totalAmount = data.reduce((sum, d) => sum + d.value, 0);

  // Calculate SVG paths for Donut Chart
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

    // Ensure arc flag is correct for slices > 50%
    const largeArcFlag = slice.percentage > 50 ? 1 : 0;

    // SVG path command
    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    
    return { ...slice, pathData };
  });

  return (
    <div className="w-full">
      {/* Type Toggle Control */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                    type === TransactionType.EXPENSE 
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#FF3B30] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <ArrowDown size={12} strokeWidth={3} /> Expense
            </button>
            <button
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                    type === TransactionType.INCOME 
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#34C759] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <ArrowUp size={12} strokeWidth={3} /> Income
            </button>
        </div>
      </div>

      {totalAmount === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-medium animate-pulse">
           <span className="text-sm">No {type} data available to visualize.</span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 bg-white dark:bg-slate-800 rounded-xl animate-enter-card">
          {/* Pie Chart SVG */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
            <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full transform -rotate-90">
              {slices.map((slice) => (
                <path 
                  key={slice.name}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="0.02"
                  className="hover:opacity-90 transition-opacity cursor-pointer dark:stroke-slate-800"
                >
                  <title>{`${slice.name}: ${slice.percentage.toFixed(1)}%`}</title>
                </path>
              ))}
              {/* Inner Circle for Donut Effect */}
              <circle cx="0" cy="0" r="0.65" className="fill-white dark:fill-slate-800" />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total</span>
              <span className={`text-lg md:text-xl font-bold ${type === TransactionType.INCOME ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                ฿{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full grid grid-cols-1 gap-2 pl-0 md:pl-4 max-h-60 overflow-y-auto custom-scrollbar">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {index + 1}
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800" style={{ backgroundColor: item.color }}></span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.name}</span>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">฿{item.value.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};