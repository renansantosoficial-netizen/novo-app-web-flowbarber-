import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, ChevronRightIcon, Calendar, DollarSign, 
  Briefcase, Coffee, Moon, Trash2, Sparkles, Scissors, RefreshCw, X, Plus
} from 'lucide-react';
import { AppData } from '../../types';
import { useFlowBarber } from '../../context/FlowBarberContext';

interface CalendarGridProps {
  data: AppData;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  onShowFolgas: () => void;
  onClearMonth: (month: number, year: number) => void;
  onClearDay: (date: string) => void;
  onDeleteRecord: (id: string) => void;
  onSetFolgaEspecifica: (date: string, periodo: 'completo' | 'manha' | 'tarde' | null) => void;
  onAddService: () => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  data, selectedDate, onSelectDate, onShowFolgas, onClearMonth, 
  onClearDay, onDeleteRecord, onSetFolgaEspecifica, onAddService 
}) => {
  const { formatCurrency, getLocalISO } = useFlowBarber();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isMarkingFolga, setIsMarkingFolga] = useState(false);
  const [folgaPopupDate, setFolgaPopupDate] = useState<string | null>(null);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', { month: 'long' }), []);
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = useMemo(() => monthFormatter.format(new Date(currentYear, currentMonth)), [currentMonth, currentYear, monthFormatter]);

  const monthStats = useMemo(() => {
    const records = data.historico.filter(r => {
      const datePart = r.data.split('T')[0];
      const [year, month] = datePart.split('-').map(Number);
      return (month - 1) === currentMonth && year === currentYear && r.tipo === 'entrada';
    });

    const totalEntradas = records.reduce((acc, r) => acc + r.valor, 0);
    
    // Count unique days worked (excluding folgas and days with no records)
    const daysWorked = new Set(records.map(r => r.data.split('T')[0])).size;
    
    // Count folgas in this month
    let folgasCount = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateKey = getLocalISO(date);
      
      const hasRecords = records.some(r => r.data.split('T')[0] === dateKey);
      if (hasRecords) continue;

      const folgaEspecifica = data.folgasEspecificas?.[dateKey];
      const folgaRecorrente = data.diasFolga.find(df => df.dia === date.getDay());
      
      const isFolga = folgaEspecifica ? (folgaEspecifica !== null) : !!folgaRecorrente;
      if (isFolga) folgasCount++;
    }

    return { totalEntradas, daysWorked, folgasCount };
  }, [data.historico, data.diasFolga, data.folgasEspecificas, currentMonth, currentYear, daysInMonth]);

  const dailyData = useMemo(() => {
    const stats: Record<string, { total: number, count: number }> = {};
    data.historico.forEach(r => {
      const dateKey = r.data.split('T')[0];
      if (!stats[dateKey]) stats[dateKey] = { total: 0, count: 0 };
      stats[dateKey].total += r.valor;
      stats[dateKey].count += 1;
    });
    return stats;
  }, [data.historico]);

  const changeMonth = (dir: number) => {
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
      onSelectDate(e.target.value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Header & Stats in one row if possible, or compact stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-white border border-slate-100 rounded-3xl p-2 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
            <ChevronLeftIcon size={20} />
          </button>
          <div className="text-center relative flex-1 flex items-center justify-center gap-2">
            <h2 className="text-xl font-black text-slate-900 capitalize">{monthName}</h2>
            <p className="text-slate-400 font-bold text-sm">{currentYear}</p>
            <button 
              onClick={() => dateInputRef.current?.showPicker()}
              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
            >
              <Calendar size={14} />
            </button>
            <input 
              type="date" 
              ref={dateInputRef} 
              className="absolute opacity-0 pointer-events-none" 
              onChange={handleDateInput}
            />
          </div>
          <button onClick={() => changeMonth(1)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entradas</p>
              <p className="text-sm font-black text-slate-900 leading-none mt-0.5">{formatCurrency(monthStats.totalEntradas).split(',')[0]}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dias</p>
              <p className="text-sm font-black text-slate-900 leading-none mt-0.5">{monthStats.daysWorked}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <Coffee size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Folgas</p>
              <p className="text-sm font-black text-slate-900 leading-none mt-0.5">{monthStats.folgasCount}</p>
            </div>
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsMarkingFolga(!isMarkingFolga)}
            className={`flex-1 py-3 px-4 border rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-sm text-xs ${isMarkingFolga ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
          >
            <Moon size={16} />
            {isMarkingFolga ? 'Concluir' : 'Marcar Folga'}
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClearMonth(currentMonth, currentYear); }}
            className="py-3 px-4 bg-white border border-orange-200 rounded-2xl flex items-center justify-center gap-2 text-orange-600 font-black hover:bg-orange-50 transition-all shadow-sm uppercase tracking-widest text-[9px]"
            title="Zerar Mês"
          >
            <Trash2 size={14} />
            Mês
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); if (selectedDate) onClearDay(selectedDate); }}
            disabled={!selectedDate}
            className={`py-3 px-4 bg-white border rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-sm uppercase tracking-widest text-[9px] ${selectedDate ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-100 text-slate-400 cursor-not-allowed opacity-50'}`}
            title="Zerar Dia"
          >
            <Trash2 size={14} />
            Dia
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
            <div key={`${d}-${idx}`} className="text-center text-[10px] font-black text-slate-300 py-2 uppercase tracking-widest">{d}</div>
          ))}
          
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, currentMonth, day);
            const dateKey = getLocalISO(date);
            const stats = dailyData[dateKey];
            const isSelected = selectedDate === dateKey;
            
            // Verifica folga específica primeiro, depois a folga recorrente
            const folgaEspecifica = data.folgasEspecificas?.[dateKey];
            const folgaRecorrente = data.diasFolga.find(d => d.dia === date.getDay());
            const folga = folgaEspecifica ? { periodo: folgaEspecifica } : folgaRecorrente;
            
            const isToday = getLocalISO(new Date()) === dateKey;

            // Eventos Especiais
            const evento = data.eventosEspeciais?.find(e => e.data === dateKey);

            return (
              <div key={day} className="relative">
                <button
                  onClick={() => {
                    if (isMarkingFolga) {
                      setFolgaPopupDate(dateKey);
                    } else {
                      onSelectDate(dateKey);
                      setShowDayDetailModal(true);
                    }
                  }}
                  className={`
                    w-full relative flex flex-col items-center justify-center rounded-xl transition-all h-12 border
                    ${isSelected && !isMarkingFolga ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_8px_20px_rgba(16,185,129,0.1)]' : 
                      isToday ? 'border-indigo-500/50 bg-indigo-500/5' : 
                      folga ? 'border-amber-200 bg-amber-50/50' :
                      evento ? 'border-' + evento.cor + '-200 bg-' + evento.cor + '-50/50' :
                      'border-transparent bg-slate-50 hover:bg-slate-100'}
                    ${folga?.periodo === 'completo' ? 'opacity-60 grayscale-[0.3]' : ''}
                    ${isMarkingFolga ? 'ring-2 ring-amber-500/20 hover:ring-amber-500/50' : ''}
                  `}
                >
                  <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                     {stats && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                     {!stats && folga?.periodo === 'completo' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                     {!stats && folga?.periodo === 'manha' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                     {!stats && folga?.periodo === 'tarde' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                     {evento && <div className={`w-1.5 h-1.5 rounded-full bg-${evento.cor}-500`} />}
                  </div>

                  {folga && (
                    <div className="absolute bottom-1.5 text-amber-500 opacity-40">
                      <Coffee size={10} />
                    </div>
                  )}

                  {evento && (
                    <div className={`absolute bottom-1.5 text-${evento.cor}-500 opacity-60`}>
                      <Sparkles size={10} />
                    </div>
                  )}

                  <span className={`text-xs font-black ${isSelected && !isMarkingFolga ? 'text-emerald-500' : isToday ? 'text-indigo-500' : 'text-slate-900'}`}>
                    {day}
                  </span>
                  
                  {stats && (
                    <span className="text-[8px] font-black text-emerald-500/80 mt-0.5">
                      €{Math.round(stats.total)}
                    </span>
                  )}
                </button>

                {/* Popup de seleção de folga para o dia */}
                <AnimatePresence>
                  {folgaPopupDate === dateKey && (
                    <motion.div
                      key={`folga-popup-${dateKey}`}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                    >
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folga: {day}/{currentMonth + 1}</span>
                        <button onClick={() => setFolgaPopupDate(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <button 
                          onClick={() => { onSetFolgaEspecifica(dateKey, 'completo'); setFolgaPopupDate(null); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${folga?.periodo === 'completo' ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          Dia Inteiro
                        </button>
                        <button 
                          onClick={() => { onSetFolgaEspecifica(dateKey, 'manha'); setFolgaPopupDate(null); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${folga?.periodo === 'manha' ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          Folga Manhã
                        </button>
                        <button 
                          onClick={() => { onSetFolgaEspecifica(dateKey, 'tarde'); setFolgaPopupDate(null); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${folga?.periodo === 'tarde' ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          Folga Tarde
                        </button>
                        <button 
                          onClick={() => { onSetFolgaEspecifica(dateKey, null); setFolgaPopupDate(null); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all mt-1 border-t border-slate-50"
                        >
                          Remover Folga
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Agendado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Folga (Dia)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-t-full bg-amber-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Folga (Manhã)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-b-full bg-amber-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Folga (Tarde)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hoje</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {showDayDetailModal && selectedDate && (
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
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agenda do Dia</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {selectedDate.split('-').reverse().join('/')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDayDetailModal(false)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Total do Dia</p>
                      <p className="text-xl font-black text-emerald-600">{formatCurrency(dailyData[selectedDate]?.total || 0)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDayDetailModal(false);
                      onAddService();
                    }}
                    className="p-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Registros</h4>
                  {data.historico
                    .filter(r => r.data.split('T')[0] === selectedDate)
                    .map((r) => (
                      <div key={`historico-modal-${r.id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.categoria === 'produto' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                            {r.categoria === 'produto' ? <DollarSign size={16} /> : <Scissors size={16} />}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm font-black text-slate-900 leading-tight">{r.descricao}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {r.clienteNome || 'Cliente não identificado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-emerald-500">
                            {formatCurrency(r.valor)}
                          </span>
                          <button 
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  
                  {(!dailyData[selectedDate] || dailyData[selectedDate].count === 0) && (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum agendamento para este dia</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setShowDayDetailModal(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarGrid;
