import React from 'react';
import { X } from 'lucide-react';
import { MetricsSection } from './MetricsSection';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    ganhosHoje: number;
    metaDiaria: number;
    metaGeral: number;
    resumoMes: number;
  };
}

export const MetricsDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, metrics }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 bg-white/80 backdrop-blur-2xl border-l border-white/20 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900">
          <X size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-900 mb-6">Métricas Detalhadas</h2>
        <MetricsSection {...metrics} />
      </div>
    </div>
  );
};
