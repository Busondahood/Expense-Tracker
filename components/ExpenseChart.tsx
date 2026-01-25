import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface ExpenseChartProps {
  transactions: Transaction[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions }) => {
  // Aggregate data by date
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { income: number; expense: number; date: Date }>();

    transactions.forEach(t => {
      // Normalize date to YYYY-MM-DD to group correctly
      const dateObj = new Date(t.created_at);
      const dateKey = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { income: 0, expense: 0, date: dateObj });
      }
      
      const entry = dailyMap.get(dateKey)!;
      if (t.type === TransactionType.INCOME) {
        entry.income += t.amount;
      } else {
        entry.expense += t.amount;
      }
    });

    // Convert map to array and sort by date (ascending)
    const sortedData = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Take the last 7 days with data for the view
    return sortedData.slice(-7);
  }, [transactions]);

  // Find max value to scale the bars
  const maxValue = useMemo(() => {
    return Math.max(
      ...chartData.map(d => Math.max(d.income, d.expense)), 
      100 // Default minimum scale so bars aren't huge for tiny amounts
    );
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Last 7 Active Days</h3>
      
      <div className="flex items-end justify-between h-48 gap-2 sm:gap-4">
        {chartData.map((day, index) => {
          const incomeHeight = (day.income / maxValue) * 100;
          const expenseHeight = (day.expense / maxValue) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 group relative">
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
                <div className="text-green-400">In: +{day.income.toLocaleString()}</div>
                <div className="text-red-400">Out: -{day.expense.toLocaleString()}</div>
              </div>

              {/* Bars Container */}
              <div className="w-full flex justify-center gap-1 h-full items-end">
                {/* Income Bar */}
                <div 
                  className="w-1.5 sm:w-3 bg-green-400 rounded-t-sm transition-all duration-500"
                  style={{ height: `${Math.max(incomeHeight, 0)}%` }}
                ></div>
                {/* Expense Bar */}
                <div 
                  className="w-1.5 sm:w-3 bg-red-400 rounded-t-sm transition-all duration-500"
                  style={{ height: `${Math.max(expenseHeight, 0)}%` }}
                ></div>
              </div>

              {/* Date Label */}
              <div className="mt-3 text-[10px] sm:text-xs text-slate-400 font-medium text-center">
                {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                <span className="hidden sm:block text-[9px] text-slate-300">
                  {day.date.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
