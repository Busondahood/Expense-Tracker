import React, { useMemo } from 'react';
import { Transaction, TransactionType, Language } from '../types';

interface MonthlyChartProps {
  transactions: Transaction[];
  lang: Language;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ transactions, lang }) => {
  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, { income: number; expense: number; monthKey: string; displayLabel: string }>();

    transactions.forEach(t => {
      try {
        const dateObj = new Date(t.created_at);
        // Key format: YYYY-MM for sorting
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { 
            income: 0, 
            expense: 0, 
            monthKey: monthKey,
            // Format: Jan 24 or ม.ค. 67
            displayLabel: dateObj.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', year: '2-digit' })
          });
        }
        
        const entry = monthlyMap.get(monthKey)!;
        if (t.type === TransactionType.INCOME) {
          entry.income += t.amount;
        } else {
          entry.expense += t.amount;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Sort by month key and take last 6 months
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);
  }, [transactions, lang]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => Math.max(d.income, d.expense)));
    return max > 0 ? max : 100;
  }, [chartData]);

  if (!transactions || transactions.length === 0) return null;

  return (
    <div className="relative h-64 w-full mt-4">
      {/* Grid Lines (Background) */}
      <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 dark:text-slate-600 pointer-events-none">
        <div className="border-b border-slate-100 dark:border-slate-700 w-full h-0"></div>
        <div className="border-b border-slate-100 dark:border-slate-700 w-full h-0"></div>
        <div className="border-b border-slate-100 dark:border-slate-700 w-full h-0"></div>
        <div className="border-b border-slate-100 dark:border-slate-700 w-full h-0"></div>
        <div className="border-b border-slate-100 dark:border-slate-700 w-full h-0"></div>
      </div>

      {/* Bars Container */}
      <div className="absolute inset-0 flex items-end justify-around px-2 pb-px">
        {chartData.map((month) => {
          const incomeHeight = Math.max((month.income / maxValue) * 100, 2);
          const expenseHeight = Math.max((month.expense / maxValue) * 100, 2);

          return (
            <div key={month.monthKey} className="flex flex-col items-center gap-2 group relative w-full max-w-[80px]">
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded py-1 px-2 whitespace-nowrap z-20 pointer-events-none shadow-lg border border-slate-700 dark:border-slate-600">
                <div className="font-bold border-b border-slate-700 dark:border-slate-600 pb-1 mb-1">{month.displayLabel}</div>
                <div className="text-green-400">In: ฿{month.income.toLocaleString()}</div>
                <div className="text-red-400">Ex: ฿{month.expense.toLocaleString()}</div>
              </div>

              {/* Bar Group */}
              <div className="flex gap-1.5 h-[220px] items-end w-full justify-center">
                {/* Income Bar */}
                <div 
                  className="w-full bg-green-500 rounded-t-sm hover:bg-green-400 transition-all cursor-pointer relative"
                  style={{ height: `${incomeHeight}%` }}
                ></div>
                
                {/* Expense Bar */}
                <div 
                  className="w-full bg-red-500 rounded-t-sm hover:bg-red-400 transition-all cursor-pointer relative"
                  style={{ height: `${expenseHeight}%` }}
                ></div>
              </div>

              {/* X-Axis Label */}
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                {month.displayLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};