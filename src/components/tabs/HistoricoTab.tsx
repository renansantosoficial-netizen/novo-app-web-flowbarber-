import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartColumn, History, X, FileText, Download, Plus, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { useFlowBarber } from '../../context/FlowBarberContext';
import { Card } from '../Card';

interface HistoricoTabProps {
  exportToCSV: (data: any[], filename: string, isHistory?: boolean) => void;
  revertRecord: (recordId: string, historyIndex: number) => void;
  deleteRecord: (id: string) => void;
}

export default function HistoricoTab({ exportToCSV, revertRecord, deleteRecord }: HistoricoTabProps) {
  const {
    data,
    chartData,
    formatCurrency,
    historicoStats,
    historyDateRange,
    setHistoryDateRange,
    setShowReportModal,
    filteredHistorico,
    visibleRecords,
    setVisibleRecords,
    setEditingRecord,
    openConfirmation
  } = useFlowBarber();

  return (
    <motion.div
      key="historico"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <ChartColumn size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Análise de Faturamento e Metas</h3>
        </div>
        
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Faturamento Diário (Mês Atual)</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyData}>
                  <defs>
                    <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} tick={{ fontWeight: 900 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#10b981', fontWeight: '900' }}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDaily)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Faturamento Mensal vs Meta</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.goalsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} tick={{ fontWeight: 900 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: '900' }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'faturamento' ? 'Faturamento' : 'Meta']}
                  />
                  <Bar dataKey="faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Histórico</h3>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {data.historico.length} Registros
                </span>
                <span className="text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  {historicoStats.servicos} Serviços
                </span>
                <span className="text-[8px] font-black text-cyan-500 uppercase bg-cyan-50 px-1.5 py-0.5 rounded-md">
                  {historicoStats.produtos} Produtos
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <input 
                type="date" 
                value={historyDateRange.start || ''}
                onChange={(e) => setHistoryDateRange(prev => ({ ...prev, start: e.target.value || null }))}
                className="text-xs font-black text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition-all"
              />
              <span className="text-slate-300 font-black text-xs">até</span>
              <input 
                type="date" 
                value={historyDateRange.end || ''}
                onChange={(e) => setHistoryDateRange(prev => ({ ...prev, end: e.target.value || null }))}
                className="text-xs font-black text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition-all"
              />
              {(historyDateRange.start || historyDateRange.end) && (
                <button 
                  onClick={() => setHistoryDateRange({ start: null, end: null })}
                  className="p-2 text-slate-400 hover:text-red-500 transition-all bg-slate-50 rounded-xl border border-slate-200"
                  title="Limpar Filtro"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button 
              onClick={() => setShowReportModal(true)}
              className="p-2 text-slate-400 hover:text-emerald-500 transition-all"
              title="Análise de Faturação e Relatórios"
            >
              <FileText size={20} />
            </button>
            <button 
              onClick={() => exportToCSV(data.historico, 'historico_completo.csv', true)}
              className="p-2 text-slate-400 hover:text-emerald-500 transition-all"
              title="Exportar Histórico Completo"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredHistorico
              .slice(0, visibleRecords)
              .map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${r.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {r.tipo === 'entrada' ? <Plus size={16} /> : <Trash2 size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">{r.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {new Date(r.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(r.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}
                          {r.clienteNome && ` • ${r.clienteNome}`}
                        </p>
                        {r.recorrencia && (
                          <span className="flex items-center gap-0.5 text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                            <RefreshCw size={8} /> {r.recorrencia}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black ${r.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {r.tipo === 'entrada' ? '+' : '-'} {formatCurrency(r.valor)}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {r.editHistory && r.editHistory.length > 0 && (
                        <motion.button 
                          whileHover={{ scale: 1.1, color: '#f59e0b' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const lastEdit = r.editHistory![r.editHistory!.length - 1];
                            openConfirmation(
                              'Reverter Edição',
                              `Deseja reverter para a versão de ${new Date(lastEdit.timestamp).toLocaleString('pt-BR')}?\n\nAnterior: ${lastEdit.oldData.descricao} (€${lastEdit.oldData.valor})`,
                              () => revertRecord(r.id, r.editHistory!.length - 1),
                              'warning'
                            );
                          }}
                          className="p-2 text-slate-300 transition-all bg-white rounded-xl shadow-sm"
                          title="Ver Histórico / Reverter"
                        >
                          <History size={14} />
                        </motion.button>
                      )}
                      <button 
                        onClick={() => setEditingRecord(r)}
                        className="p-2 text-slate-300 hover:text-indigo-500 transition-all bg-white rounded-xl shadow-sm"
                      >
                        <Pencil size={14} />
                      </button>
                      <motion.button 
                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          openConfirmation(
                            'Excluir Registro',
                            'Deseja realmente excluir este registro financeiro?',
                            () => deleteRecord(r.id)
                          );
                        }}
                        className="p-2 text-slate-300 transition-all bg-white rounded-xl shadow-sm"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
          
          {filteredHistorico.length > visibleRecords && (
            <button 
              onClick={() => setVisibleRecords(prev => prev + 10)}
              className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-emerald-500 transition-all uppercase tracking-widest"
            >
              Carregar mais registros
            </button>
          )}

          {data.historico.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
