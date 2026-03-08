/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Users, 
  Calendar, 
  TrendingUp, 
  History, 
  Plus, 
  Settings, 
  LogOut, 
  Share2, 
  Trash2, 
  Search,
  ChevronLeft,
  ChevronRight,
  Target,
  DollarSign,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, DayOffConfig } from './types';

// --- Utils ---
const formatCurrency = (v: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getLocalISO = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

// --- Components ---

const Card = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-card p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const AnimatedTitle = ({ text }: { text: string }) => {
  const characters = Array.from(text);
  return (
    <div className="flex justify-center overflow-hidden">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.05,
            ease: [0.2, 0.65, 0.3, 0.9]
          }}
          className="text-4xl md:text-6xl font-black tracking-tighter text-emerald-600 drop-shadow-sm"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('flowBarberData');
    return saved ? JSON.parse(saved) : DEFAULT_DATA;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('flowBarberLoggedIn') === '1');
  const [activeTab, setActiveTab] = useState<'servicos' | 'produtos'>('servicos');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMetaPopup, setShowMetaPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showFolgaPopup, setShowFolgaPopup] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('flowBarberData', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (isLoggedIn) sessionStorage.setItem('flowBarberLoggedIn', '1');
    else sessionStorage.removeItem('flowBarberLoggedIn');
  }, [isLoggedIn]);

  // Calculations
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthRecords = data.historico.filter(r => {
      const d = new Date(r.data);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const faturamento = monthRecords
      .filter(r => r.tipo === 'entrada')
      .reduce((acc, r) => acc + r.valor, 0);

    const comissao = (faturamento * data.percentualGanho) / 100;

    return { faturamento, comissao };
  }, [data]);

  const metaProgress = useMemo(() => {
    if (data.meta <= 0) return 0;
    return Math.min(100, (data.saldo / data.meta) * 100);
  }, [data.saldo, data.meta]);

  // Actions
  const addRecord = (valor: number, descricao: string, cliente?: { nome: string, tel: string }) => {
    const newRecord: HistoryRecord = {
      id: Date.now(),
      descricao,
      valor,
      tipo: 'entrada',
      data: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
      clienteNome: cliente?.nome || null,
      clienteTelefone: cliente?.tel || null
    };

    setData(prev => ({
      ...prev,
      saldo: prev.saldo + valor,
      historico: [newRecord, ...prev.historico]
    }));
  };

  const deleteRecord = (id: number) => {
    const record = data.historico.find(r => r.id === id);
    if (!record) return;

    setData(prev => ({
      ...prev,
      saldo: record.tipo === 'entrada' ? prev.saldo - record.valor : prev.saldo + record.valor,
      historico: prev.historico.filter(r => r.id !== id)
    }));
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-400 font-bold text-sm uppercase tracking-widest">Dashboard</h2>
          <h1 className="text-2xl font-black text-slate-900">Flow Barber</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {}} 
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="p-3 rounded-2xl bg-white border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Balance */}
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-emerald-200/50">
        <div className="space-y-1 text-center">
          <AnimatedTitle text="Flow Barber" />
          <p className="text-emerald-100 font-bold text-xs tracking-[0.2em] uppercase pt-4">Saldo Total Disponível</p>
          <h3 className="text-5xl font-black tracking-tight">{formatCurrency(data.saldo)}</h3>
        </div>
      </Card>

      {/* Monthly Commission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card delay={0.1}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {data.percentualGanho}% Comissão
            </span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ganhos do Mês</p>
          <h4 className="text-2xl font-black text-slate-900">{formatCurrency(monthlyStats.comissao)}</h4>
          <p className="text-slate-400 text-xs mt-1">
            sobre {formatCurrency(monthlyStats.faturamento)} faturados
          </p>
        </Card>

        <Card delay={0.2}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Target size={20} />
            </div>
            <button 
              onClick={() => setShowMetaPopup(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            >
              <Settings size={16} />
            </button>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Meta Mensal</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-900">{formatCurrency(data.saldo)}</h4>
            <span className="text-slate-300 font-bold text-sm">/ {formatCurrency(data.meta)}</span>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${metaProgress}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
        </Card>
      </div>

      {/* Services Section */}
      <Card delay={0.3} className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Scissors size={20} />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('servicos')}
                className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${
                  activeTab === 'servicos' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => setActiveTab('produtos')}
                className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${
                  activeTab === 'produtos' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Produtos
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowSettingsPopup(true)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <Settings size={20} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'servicos' ? (
            <motion.div
              key="servicos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {selectedDate && (
                <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <Calendar size={14} />
                  Registrando para: {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="ml-auto hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.servicos.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addRecord(s.valor, s.nome)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{s.nome}</span>
                    <span className="text-lg font-black text-indigo-600">{formatCurrency(s.valor)}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="produtos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="py-8 text-center space-y-4"
            >
              <div className="inline-flex p-4 bg-slate-100 text-slate-400 rounded-full">
                <Clock size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">Produtos em Breve</h4>
                <p className="text-sm text-slate-400 font-medium max-w-[200px] mx-auto">
                  Estamos preparando o controle de estoque e vendas de produtos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Calendar & History */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Faturamento Diário</h3>
          <button 
            onClick={() => setShowFolgaPopup(true)}
            className="ml-auto text-xs font-bold text-blue-600 hover:underline"
          >
            Configurar Folgas
          </button>
        </div>
        
        <CalendarGrid 
          data={data} 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />
      </div>

      {/* History List */}
      <Card delay={0.4}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <History size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900">Histórico Recente</h3>
          </div>
          {selectedDate && (
            <button 
              onClick={() => {
                if(confirm('Zerar registros deste dia?')) {
                  setData(prev => ({
                    ...prev,
                    historico: prev.historico.filter(r => getLocalISO(new Date(r.data)) !== selectedDate)
                  }));
                }
              }}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Zerar Dia
            </button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {data.historico
              .filter(r => !selectedDate || getLocalISO(new Date(r.data)) === selectedDate)
              .slice(0, 10)
              .map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${r.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {r.tipo === 'entrada' ? <Plus size={18} /> : <Trash2 size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{r.descricao}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(r.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(r.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-black ${r.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.tipo === 'entrada' ? '+' : '-'} {formatCurrency(r.valor)}
                    </span>
                    <button 
                      onClick={() => deleteRecord(r.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
          {data.historico.length === 0 && (
            <div className="text-center py-8 text-slate-400 font-medium">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </Card>

      {/* Popups */}
      <AnimatePresence>
        {showMetaPopup && (
          <Popup title="Editar Meta" onClose={() => setShowMetaPopup(false)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Valor da Meta (R$)</label>
                <input 
                  type="number" 
                  defaultValue={data.meta}
                  onBlur={(e) => setData(prev => ({ ...prev, meta: Number(e.target.value) }))}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-lg"
                />
              </div>
              <button onClick={() => setShowMetaPopup(false)} className="btn-primary w-full">Salvar Meta</button>
            </div>
          </Popup>
        )}

        {showSettingsPopup && (
          <Popup title="Configurações de Serviços" onClose={() => setShowSettingsPopup(false)}>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">Serviços Atuais</h4>
                <div className="space-y-2">
                  {data.servicos.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={s.nome}
                        onChange={(e) => {
                          const newServicos = [...data.servicos];
                          newServicos[i].nome = e.target.value;
                          setData(prev => ({ ...prev, servicos: newServicos }));
                        }}
                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                      />
                      <input 
                        type="number" 
                        value={s.valor}
                        onChange={(e) => {
                          const newServicos = [...data.servicos];
                          newServicos[i].valor = Number(e.target.value);
                          setData(prev => ({ ...prev, servicos: newServicos }));
                        }}
                        className="w-24 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                      />
                      <button 
                        onClick={() => setData(prev => ({ ...prev, servicos: prev.servicos.filter((_, idx) => idx !== i) }))}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setData(prev => ({ ...prev, servicos: [...prev.servicos, { nome: 'Novo Serviço', valor: 0 }] }))}
                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-400 transition-all"
                >
                  <Plus size={18} /> Adicionar Serviço
                </button>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Percentual de Ganho</h4>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={data.percentualGanho}
                    onChange={(e) => setData(prev => ({ ...prev, percentualGanho: Number(e.target.value) }))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-lg font-black text-indigo-600 w-12">{data.percentualGanho}%</span>
                </div>
                <p className="text-[10px] text-indigo-400 font-bold leading-tight">
                  Este percentual é usado para calcular sua comissão mensal sobre o faturamento total.
                </p>
              </div>
            </div>
          </Popup>
        )}

        {showFolgaPopup && (
          <Popup title="Configurar Folgas" onClose={() => setShowFolgaPopup(false)}>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold">
                Dias marcados como folga não somam valores no dashboard geral.
              </p>
              <div className="space-y-2">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, i) => {
                  const config = data.diasFolga.find(d => d.dia === i);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={!!config}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setData(prev => ({ ...prev, diasFolga: [...prev.diasFolga, { dia: i, periodo: 'completo' }] }));
                            } else {
                              setData(prev => ({ ...prev, diasFolga: prev.diasFolga.filter(d => d.dia !== i) }));
                            }
                          }}
                          className="w-5 h-5 rounded-lg accent-emerald-500"
                        />
                        <span className="font-bold text-slate-700">{dia}</span>
                      </div>
                      {config && (
                        <select 
                          value={config.periodo}
                          onChange={(e) => {
                            const newFolgas = data.diasFolga.map(d => d.dia === i ? { ...d, periodo: e.target.value as any } : d);
                            setData(prev => ({ ...prev, diasFolga: newFolgas }));
                          }}
                          className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-bold outline-none"
                        >
                          <option value="completo">Dia Inteiro</option>
                          <option value="manha">Manhã</option>
                          <option value="tarde">Tarde</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowFolgaPopup(false)} className="btn-primary w-full">Salvar Configurações</button>
            </div>
          </Popup>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---

const CalendarGrid = ({ data, selectedDate, onSelectDate }: { data: AppData, selectedDate: string | null, onSelectDate: (d: string | null) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, currentMonth));

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    data.historico.forEach(r => {
      const dateKey = getLocalISO(new Date(r.data));
      totals[dateKey] = (totals[dateKey] || 0) + r.valor;
    });
    return totals;
  }, [data.historico]);

  const changeMonth = (dir: number) => {
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-black text-slate-800 capitalize">{monthName} {currentYear}</h4>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
          <div key={`${d}-${idx}`} className="text-center text-[10px] font-black text-slate-300 py-1">{d}</div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentYear, currentMonth, day);
          const dateKey = getLocalISO(date);
          const total = dailyTotals[dateKey] || 0;
          const isSelected = selectedDate === dateKey;
          const folga = data.diasFolga.find(d => d.dia === date.getDay());

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              className={`
                relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-14
                ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}
                ${folga?.periodo === 'completo' ? 'opacity-40 grayscale' : ''}
              `}
            >
              <span className={`text-[10px] font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{day}</span>
              <span className={`text-[10px] font-black mt-1 ${total > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                {total > 0 ? formatCurrency(total).replace('R$', '') : '—'}
              </span>
              {folga && (
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${folga.periodo === 'completo' ? 'bg-red-400' : 'bg-amber-400'}`} />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};

const Popup = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="glass-card w-full max-w-md p-8 space-y-6"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
          <Plus className="rotate-45" size={24} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const savedAuth = localStorage.getItem('flowBarberAuth');

  const handleLogin = () => {
    if (!savedAuth) {
      if (password.length < 4) {
        setError('Senha deve ter pelo menos 4 dígitos.');
        return;
      }
      localStorage.setItem('flowBarberAuth', password);
      onLogin();
    } else {
      if (password === savedAuth) {
        onLogin();
      } else {
        setError('Senha incorreta.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-sm space-y-8 p-10">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl mb-4">
            <Scissors size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flow Barber</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            {savedAuth ? 'Bem-vindo de volta' : 'Configure seu acesso'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Senha de Acesso</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-center text-2xl tracking-[0.5em] font-black"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <button 
            onClick={handleLogin}
            className="btn-primary w-full py-4 text-lg"
          >
            {savedAuth ? 'Entrar no Sistema' : 'Criar Senha'}
          </button>
        </div>
      </Card>
    </div>
  );
};
