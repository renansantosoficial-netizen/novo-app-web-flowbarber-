import React from 'react';
import { Target, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface MetricsProps {
  ganhosHoje: number;
  metaDiaria: number;
  metaGeral: number;
  resumoMes: number;
}

export const MetricsSection: React.FC<MetricsProps> = ({ ganhosHoje, metaDiaria, metaGeral, resumoMes }) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-white/70 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-lg">
      <MetricItem icon={<DollarSign size={16} />} label="Ganhos Hoje" value={ganhosHoje} />
      <MetricItem icon={<Target size={16} />} label="Meta Diária" value={metaDiaria} />
      <MetricItem icon={<Target size={16} />} label="Meta Geral" value={metaGeral} />
      <MetricItem icon={<Calendar size={16} />} label="Resumo Mês" value={resumoMes} />
    </div>
  );
};

const MetricItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl">
    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">{icon}</div>
    <div>
      <p className="text-[9px] font-bold text-slate-500 uppercase">{label}</p>
      <p className="text-xs font-black text-slate-900">€{value.toFixed(2)}</p>
    </div>
  </div>
);
