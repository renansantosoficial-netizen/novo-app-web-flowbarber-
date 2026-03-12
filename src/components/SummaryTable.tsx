import React from 'react';
import { Card } from './Card';
import { motion } from 'motion/react';
import { ChartColumn } from 'lucide-react';

interface SummaryTableProps {
  data: {
    totalRevenue: number;
    totalServices: number;
    totalProducts: number;
    avgTicket: number;
  };
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ data }) => {
  return (
    <Card className="bg-white border-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Resumo do Mês</h3>
        <motion.div 
          animate={{ 
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="p-2 bg-indigo-500/20 text-indigo-700 rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.1)]"
        >
          <ChartColumn size={16} />
        </motion.div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faturamento</p>
          <p className="text-xl font-black text-slate-800">€{data.totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</p>
          <p className="text-xl font-black text-slate-800">€{data.avgTicket.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Serviços</p>
          <p className="text-xl font-black text-slate-800">{data.totalServices}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Produtos</p>
          <p className="text-xl font-black text-slate-800">{data.totalProducts}</p>
        </div>
      </div>
    </Card>
  );
};
