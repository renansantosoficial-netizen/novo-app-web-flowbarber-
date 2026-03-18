import React, { useState } from 'react';
import { X, Search, Plus, ShoppingBag, Scissors, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Product } from '../types';

interface CatalogSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicos: Service[];
  produtos: Product[];
  onSelect: (item: Service | Product, categoria: 'servico' | 'produto') => void;
}

export const CatalogSelectionModal = ({ isOpen, onClose, servicos, produtos, onSelect }: CatalogSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'servicos' | 'produtos'>('servicos');

  const filteredItems = (activeTab === 'servicos' ? servicos : produtos).filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Adicionar da Agenda</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Selecione um item do catálogo</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar no catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex p-1 bg-slate-200/50 rounded-2xl">
            <button
              onClick={() => setActiveTab('servicos')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'servicos' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Scissors size={14} /> Serviços
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'produtos' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShoppingBag size={14} /> Produtos
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item, activeTab === 'servicos' ? 'servico' : 'produto')}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    activeTab === 'servicos' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-cyan-50 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white'
                  }`}>
                    {activeTab === 'servicos' ? <Scissors size={20} /> : <ShoppingBag size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">{item.nome}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">€ {item.valor.toFixed(2)}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Plus size={16} />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum item encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
            Selecione um item para adicionar à agenda do dia selecionado
          </p>
        </div>
      </motion.div>
    </div>
  );
};
