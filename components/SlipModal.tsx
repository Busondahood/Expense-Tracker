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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Transaction Slip</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex justify-center bg-slate-50 dark:bg-slate-900/50">
          <img 
            src={imageUrl} 
            alt="Slip" 
            className="max-h-[70vh] object-contain rounded-md shadow-sm"
          />
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};