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
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-slate-800">Transaction Slip</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex justify-center bg-slate-50">
          <img 
            src={imageUrl} 
            alt="Slip" 
            className="max-h-[70vh] object-contain rounded-md shadow-sm"
          />
        </div>
        <div className="p-4 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
