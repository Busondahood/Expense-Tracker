import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  type: 'neutral' | 'success' | 'danger';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, amount, icon: Icon, type }) => {
  let colorClass = 'text-slate-800 dark:text-slate-100';
  let bgClass = 'bg-white dark:bg-slate-800';
  let iconBgClass = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

  if (type === 'success') {
    colorClass = 'text-green-600 dark:text-green-400';
    iconBgClass = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  } else if (type === 'danger') {
    colorClass = 'text-red-600 dark:text-red-400';
    iconBgClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  }

  return (
    <div className={`${bgClass} p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors`}>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>
          ฿{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h3>
      </div>
      <div className={`p-3 rounded-full ${iconBgClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};