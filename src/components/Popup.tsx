import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

interface PopupProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Popup = React.forwardRef<HTMLDivElement, PopupProps>(({ title, children, onClose }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 sm:pb-8 space-y-6 border-t sm:border border-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.15)]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <button 
          onClick={onClose} 
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400"
        >
          <Plus className="rotate-45" size={24} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar text-slate-900">
        {children}
      </div>
    </motion.div>
  </motion.div>
));

Popup.displayName = 'Popup';
