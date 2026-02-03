import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  type: 'neutral' | 'success' | 'danger';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, amount, icon: Icon, type }) => {
  let amountClass = 'text-slate-900 dark:text-white';
  let iconClass = 'text-slate-500 dark:text-slate-400';
  let bgIconClass = 'bg-slate-100 dark:bg-[#2C2C2E]';

  if (type === 'success') {
    amountClass = 'text-[#34C759]'; // iOS Green
    iconClass = 'text-[#34C759]';
    bgIconClass = 'bg-[#34C759]/10';
  } else if (type === 'danger') {
    amountClass = 'text-[#FF3B30]'; // iOS Red
    iconClass = 'text-[#FF3B30]';
    bgIconClass = 'bg-[#FF3B30]/10';
  }

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-full transition-all active:scale-95 duration-200 cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide opacity-80">{title}</span>
        <div className={`p-2 rounded-full ${bgIconClass} ${iconClass}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-bold tracking-tight ${amountClass}`}>
          ฿{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
    </div>
  );
};