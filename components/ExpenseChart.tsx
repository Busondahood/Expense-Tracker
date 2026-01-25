import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface ExpenseChartProps {
  transactions: Transaction[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions }) => {
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { income: number; expense: number; dateStr: string; dayName: string }>();

    transactions.forEach(t => {
      try {
        const dateObj = new Date(t.created_at);
        // Robust YYYY-MM-DD formatting
        const dateKey = dateObj.toISOString().split('T')[0]; 
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { 
            income: 0, 
            expense: 0, 
            dateStr: dateKey,
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
          });
        }
        
        const entry = dailyMap.get(dateKey)!;
        if (t.type === TransactionType.INCOME) {
          entry.income += t.amount;
        } else {
          entry.expense += t.amount;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Sort by date and take last 7 entries
    return Array.from(dailyMap.values())
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(-7);
  }, [transactions]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => Math.max(d.income, d.expense)));
    return max > 0 ? max : 100;
  }, [chartData]);

  if (!transactions || transactions.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Income vs Expense (Last 7 Active Days)</h3>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Income
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div> Expense
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64 w-full">
        {/* Grid Lines (Background) */}
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none">
          <div className="border-b border-slate-100 w-full h-0"></div>
          <div className="border-b border-slate-100 w-full h-0"></div>
          <div className="border-b border-slate-100 w-full h-0"></div>
          <div className="border-b border-slate-100 w-full h-0"></div>
          <div className="border-b border-slate-100 w-full h-0 border-slate-200"></div> {/* Bottom line */}
        </div>

        {/* Bars Container */}
        <div className="absolute inset-0 flex items-end justify-around px-2 pb-px">
          {chartData.map((day) => {
            const incomeHeight = Math.max((day.income / maxValue) * 100, 2); // Min 2% height for visibility
            const expenseHeight = Math.max((day.expense / maxValue) * 100, 2);

            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 group relative w-full max-w-[60px]">
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded py-1 px-2 whitespace-nowrap z-20 pointer-events-none shadow-lg">
                  <div className="font-bold border-b border-slate-700 pb-1 mb-1">{day.dateStr}</div>
                  <div className="text-green-400">In: ฿{day.income.toLocaleString()}</div>
                  <div className="text-red-400">Ex: ฿{day.expense.toLocaleString()}</div>
                </div>

                {/* Bar Group */}
                <div className="flex gap-1 h-[220px] items-end w-full justify-center">
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
                <div className="text-[10px] font-medium text-slate-500 truncate w-full text-center">
                  {day.dayName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
