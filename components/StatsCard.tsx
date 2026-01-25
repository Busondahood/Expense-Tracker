import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  type: 'neutral' | 'success' | 'danger';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, amount, icon: Icon, type }) => {
  let colorClass = 'text-slate-800';
  let bgClass = 'bg-white';
  let iconBgClass = 'bg-slate-100 text-slate-600';

  if (type === 'success') {
    colorClass = 'text-green-600';
    iconBgClass = 'bg-green-100 text-green-600';
  } else if (type === 'danger') {
    colorClass = 'text-red-600';
    iconBgClass = 'bg-red-100 text-red-600';
  }

  return (
    <div className={`${bgClass} p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
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
