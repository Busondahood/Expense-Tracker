import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { Stats, BudgetSettings } from '../types';
import { TRANSLATIONS, Language } from '../types';

interface BalanceCardProps {
  stats: Stats;
  budgetSettings: BudgetSettings;
  budgetPercent: number;
  glowEnabled: boolean;
  t: typeof TRANSLATIONS['en'];
}

const AnimatedCounter = ({ value, showDirectionColor = false }: { value: number, showDirectionColor?: boolean }) => {
  const { count, isAnimating, direction } = useAnimatedCounter(value, 800);
  
  let animationClass = '';
  if (isAnimating && showDirectionColor) {
    animationClass = direction === 'up' 
      ? 'text-emerald-300 scale-105' 
      : 'text-rose-300 scale-105';
  } else if (isAnimating) {
    animationClass = 'scale-[1.02] text-white/90';
  }

  return (
    <span className={`inline-block tabular-nums tracking-tight transition-all duration-300 ease-out ${animationClass}`}>
      {count.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

export const BalanceCard: React.FC<BalanceCardProps> = ({ stats, budgetSettings, budgetPercent, glowEnabled, t }) => {
  return (
    <div className="space-y-4">
      {/* Budget Bar */}
      {budgetSettings.enabled && (
        <div className="animate-enter-card delay-0">
          <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.setBudget}</span>
            <span className={`text-[10px] font-bold ${budgetPercent > budgetSettings.alertThreshold ? 'text-rose-500' : 'text-indigo-500'}`}>
              {budgetPercent.toFixed(1)}% used
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-spring relative overflow-hidden ${
                budgetPercent > 90 ? 'bg-gradient-to-r from-rose-500 to-red-400' : 
                budgetPercent > budgetSettings.alertThreshold ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 
                'bg-gradient-to-r from-indigo-500 to-cyan-400'
              }`} 
              style={{ width: `${budgetPercent}%` }}
            >
              <div className="w-full h-full opacity-40 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Balance Card */}
      <div className="balance-card rounded-[28px] p-7 relative overflow-hidden animate-enter-card delay-0">
        {/* Animated gradient orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-violet-500/30 to-indigo-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-gradient-to-tr from-cyan-500/20 to-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">{t.totalBalance}</span>
          </div>
          
          <h2 className={`text-[44px] md:text-[52px] leading-none font-black tracking-tighter mb-8 text-white ${glowEnabled ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : ''}`}>
            ฿<AnimatedCounter value={stats.balance} showDirectionColor={true} />
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 group cursor-default hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-400/20 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform duration-300 ease-spring">
                  <ArrowUp size={16} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{t.income}</div>
                  <div className="text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">฿<AnimatedCounter value={stats.income} /></div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 group cursor-default hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-400/20 rounded-xl text-rose-300 group-hover:scale-110 transition-transform duration-300 ease-spring">
                  <ArrowDown size={16} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{t.expense}</div>
                  <div className="text-[15px] font-bold text-white group-hover:text-rose-300 transition-colors">฿<AnimatedCounter value={stats.expense} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
