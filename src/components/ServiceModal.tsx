import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';

export const ServiceModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) => {
  const [service, setService] = React.useState('');
  const [price, setPrice] = React.useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Adicionar Serviço</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome do serviço"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-100 font-black text-sm outline-none"
              />
              <input
                type="number"
                placeholder="Valor (€)"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-100 font-black text-sm outline-none"
              />
              <button
                onClick={() => {
                  onSave({ nome: service, valor: price });
                  onClose();
                }}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
              >
                <CheckCircle2 size={18} />
                Salvar Serviço
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
