import React from 'react';
import { BarChart3, PieChart, Image } from 'lucide-react';
import { Transaction, TRANSLATIONS } from '../types';
import { SmartBarChart } from './SmartBarChart';
import { CategoryPieChart } from './CategoryPieChart';

interface AnalyticsPanelProps {
  transactions: Transaction[];
  chartView: 'timeline' | 'pie';
  setChartView: (v: 'timeline' | 'pie') => void;
  handleDownloadChart: () => void;
  chartRef: React.RefObject<HTMLDivElement | null>;
  glowEnabled: boolean;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  transactions, chartView, setChartView, handleDownloadChart, chartRef, glowEnabled
}) => {
  return (
    <div className="animate-enter-card delay-200">
      <h3 className="ml-1 mb-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Analytics</h3>
      <div className="card-elevated rounded-[24px] p-6 border border-slate-100 dark:border-white/5" ref={chartRef} data-chart-container="true">
        <div className="flex items-center justify-between mb-5">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button onClick={() => setChartView('timeline')} className={`px-4 py-2 text-[12px] font-bold rounded-xl flex items-center gap-2 transition-all duration-300 ease-spring ${chartView === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white scale-100' : 'text-slate-400 scale-95 hover:text-slate-600'}`}>
              <BarChart3 size={14} /> Timeline
            </button>
            <button onClick={() => setChartView('pie')} className={`px-4 py-2 text-[12px] font-bold rounded-xl flex items-center gap-2 transition-all duration-300 ease-spring ${chartView === 'pie' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white scale-100' : 'text-slate-400 scale-95 hover:text-slate-600'}`}>
              <PieChart size={14} /> Categories
            </button>
          </div>
          <button onClick={handleDownloadChart} className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-indigo-500 active:scale-90 transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600">
            <Image size={15}/>
          </button>
        </div>
        {chartView === 'timeline' && <SmartBarChart transactions={transactions} />}
        {chartView === 'pie' && <CategoryPieChart transactions={transactions} />}
      </div>
    </div>
  );
};
