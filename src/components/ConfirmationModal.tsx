import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  const colors = {
    danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
    info: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30'
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-indigo-500 bg-indigo-50'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-2xl ${iconColors[variant]}`}>
                <AlertTriangle size={32} />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#f1f5f9' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="py-3 px-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`py-3 px-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${colors[variant]}`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
