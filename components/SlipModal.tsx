import React from 'react';
import { X } from 'lucide-react';

interface SlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const SlipModal: React.FC<SlipModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="relative card-elevated rounded-t-[32px] md:rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-white/10 mt-auto md:mt-0 animate-enter-card md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#1C1C1E]">
          <h3 className="text-[17px] font-semibold text-black dark:text-white tracking-tight">Transaction Slip</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 rounded-xl transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 flex justify-center bg-slate-50 dark:bg-slate-900/50">
          <img 
            src={imageUrl} 
            alt="Slip" 
            className="max-h-[70vh] object-contain rounded-2xl shadow-lg"
          />
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-[10px] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-black dark:text-white rounded-[14px] hover:bg-[#D1D1D6] dark:hover:bg-[#3A3A3C] transition-colors font-semibold text-[15px] active:scale-[0.97]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};