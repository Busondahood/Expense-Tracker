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
        className="relative card-elevated rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-white/10 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Transaction Slip</h3>
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
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm active:scale-[0.97]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};