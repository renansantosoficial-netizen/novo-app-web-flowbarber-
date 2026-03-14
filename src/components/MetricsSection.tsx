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
    <div className="grid grid-cols-4 gap-2 p-3 bg-white/60 backdrop-blur-2xl border border-white/20 rounded-[24px] shadow-sm">
      <MetricItem icon={<DollarSign size={12} />} label="Hoje" value={ganhosHoje} />
      <MetricItem icon={<Target size={12} />} label="Meta D" value={metaDiaria} />
      <MetricItem icon={<Target size={12} />} label="Meta G" value={metaGeral} />
      <MetricItem icon={<Calendar size={12} />} label="Mês" value={resumoMes} />
    </div>
  );
};

const MetricItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="flex flex-col items-center justify-center p-1.5 bg-slate-50/50 rounded-xl border border-slate-100/50">
    <div className="text-emerald-600 mb-1">{icon}</div>
    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">{label}</p>
    <p className="text-[10px] font-black text-slate-900 leading-none">€{Math.round(value)}</p>
  </div>
);
