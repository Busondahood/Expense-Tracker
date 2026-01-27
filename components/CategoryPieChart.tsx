import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

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
  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const map = new Map<string, number>();
    expenses.forEach(t => {
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
  }, [transactions]);

  const totalExpense = data.reduce((sum, d) => sum + d.value, 0);

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

    const largeArcFlag = slice.percentage > 50 ? 1 : 0;

    // SVG path command: Move to (0,0), Line to start, Arc to end, Close path
    // Note: This logic creates a full pie. We mask the center later for donut effect.
    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    
    return { ...slice, pathData };
  });

  if (totalExpense === 0) return (
    <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
      No expense data available to visualize.
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-white dark:bg-slate-800 rounded-xl">
      {/* Pie Chart SVG */}
      <div className="relative w-56 h-56 md:w-64 md:h-64 flex-shrink-0">
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
           <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</span>
           <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">฿{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pl-0 md:pl-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
             <div className="flex items-center gap-3">
               <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {index + 1}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800" style={{ backgroundColor: item.color }}></span>
               </div>
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
             </div>
             <div className="text-right">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">฿{item.value.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.percentage.toFixed(1)}%</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};