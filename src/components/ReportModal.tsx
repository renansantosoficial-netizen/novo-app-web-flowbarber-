import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AppData } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  const generateSuperReport = () => {
    const doc = new jsPDF();
    const barberName = data.barberName || "Flow Barber";
    
    // Filter data based on period
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const filteredRecords = data.historico.filter(r => {
      if (period === 'all') return true;
      const rDate = new Date(r.data);
      return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
    });

    const entradas = filteredRecords.filter(r => r.tipo === 'entrada');
    const saidas = filteredRecords.filter(r => r.tipo === 'saida');
    
    const faturacaoTotal = entradas.reduce((acc, r) => acc + r.valor, 0);
    const despesasTotal = saidas.reduce((acc, r) => acc + r.valor, 0);
    
    const comissaoServicos = entradas.filter(r => r.categoria === 'servico').reduce((acc, r) => acc + (r.valor * (data.percentualGanho / 100)), 0);
    const comissaoProdutos = entradas.filter(r => r.categoria === 'produto').reduce((acc, r) => acc + (r.valor * (data.percentualProdutos / 100)), 0);
    const comissaoTotal = comissaoServicos + comissaoProdutos;

    const lucroLiquido = comissaoTotal - despesasTotal;
    
    const mediaAtendimento = entradas.length > 0 ? faturacaoTotal / entradas.length : 0;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(barberName, 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Super-Relatório Detalhado - ${period === 'month' ? 'Mês Atual' : 'Todo o Período'}`, 14, 28);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 34);

    // Resumo Financeiro
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Resumo Financeiro", 14, 45);
    
    (doc as any).autoTable({
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Faturação Bruta', `€ ${faturacaoTotal.toFixed(2)}`],
        ['Comissões (Serviços + Produtos)', `€ ${comissaoTotal.toFixed(2)}`],
        ['Despesas', `€ ${despesasTotal.toFixed(2)}`],
        ['Lucro Líquido (Comissões - Despesas)', `€ ${lucroLiquido.toFixed(2)}`],
        ['Média por Atendimento', `€ ${mediaAtendimento.toFixed(2)}`],
        ['Total de Atendimentos', `${entradas.length}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-500
      styles: { fontSize: 10, cellPadding: 4 },
    });

    // Detalhamento de Serviços
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Detalhamento de Entradas (Serviços e Produtos)", 14, finalY + 15);

    const tableData = entradas.map(r => [
      new Date(r.data).toLocaleDateString('pt-BR'),
      r.descricao,
      r.categoria === 'servico' ? 'Serviço' : 'Produto',
      `€ ${r.valor.toFixed(2)}`,
      `€ ${(r.valor * (r.categoria === 'servico' ? data.percentualGanho : data.percentualProdutos) / 100).toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Data', 'Descrição', 'Categoria', 'Valor Bruto', 'Comissão']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }, // indigo-500
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`Relatorio_${barberName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md apple-glass p-6 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-500/10 hover:bg-slate-500/20 rounded-2xl text-slate-400 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Super-Relatório</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Análise Detalhada (PDF)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período de Análise</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPeriod('month')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all font-bold text-sm ${period === 'month' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <Calendar size={16} />
                    Mês Atual
                  </button>
                  <button
                    onClick={() => setPeriod('all')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all font-bold text-sm ${period === 'all' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <FileText size={16} />
                    Todo Período
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-700 mb-2">O que inclui este relatório?</h4>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                  <li>Faturação Bruta Total</li>
                  <li>Comissões Detalhadas (Serviços e Produtos)</li>
                  <li>Total de Despesas</li>
                  <li>Média de Valor por Atendimento</li>
                  <li>Detalhamento de cada serviço/produto</li>
                </ul>
              </div>

              <button
                onClick={generateSuperReport}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/30"
              >
                <Download size={18} />
                Gerar Relatório PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
