/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Clock,
  RefreshCw,
  LayoutGrid,
  ChartColumn,
  Moon,
  Sun,
  Briefcase,
  Coffee,
  Package,
  Sparkles,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell
} from 'recharts';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, DayOffConfig } from './types';
import { getAIInsights, getMarketTrends } from './services/geminiService';
import Cropper from 'react-easy-crop';

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
    className={`glass-card p-5 ${className}`}
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
    if (!saved) return DEFAULT_DATA;
    try {
      const parsed = JSON.parse(saved);
      // Merge with DEFAULT_DATA to ensure new fields exist
      return {
        ...DEFAULT_DATA,
        ...parsed,
        // Ensure arrays exist even if missing in parsed data
        servicos: parsed.servicos || DEFAULT_DATA.servicos,
        produtos: parsed.produtos || DEFAULT_DATA.produtos,
        historico: parsed.historico || DEFAULT_DATA.historico,
        contatos: parsed.contatos || DEFAULT_DATA.contatos,
        diasFolga: parsed.diasFolga || DEFAULT_DATA.diasFolga,
        percentualGanho: parsed.percentualGanho ?? DEFAULT_DATA.percentualGanho,
        percentualProdutos: parsed.percentualProdutos ?? DEFAULT_DATA.percentualProdutos,
        saldo: parsed.saldo ?? DEFAULT_DATA.saldo,
        meta: parsed.meta ?? DEFAULT_DATA.meta,
      };
    } catch (e) {
      return DEFAULT_DATA;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('flowBarberLoggedIn') === '1');
  const [darkMode, setDarkMode] = useState(true);
  const [mainTab, setMainTab] = useState<'inicio' | 'agenda' | 'analytics' | 'historico' | 'config'>('inicio');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dark Mode System Sync
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryList | MediaQueryListEvent) => {
      // Only sync if user hasn't manually set a preference in this session
      if (!sessionStorage.getItem('flowBarberThemeManual')) {
        setDarkMode(e.matches);
      }
    };
    
    if (!sessionStorage.getItem('flowBarberThemeManual')) {
      setDarkMode(mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    sessionStorage.setItem('flowBarberThemeManual', '1');
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);
  const [activeTab, setActiveTab] = useState<'servicos' | 'produtos'>('servicos');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMetaPopup, setShowMetaPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showFolgaPopup, setShowFolgaPopup] = useState(false);
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [pendingService, setPendingService] = useState<{ nome: string, valor: number, categoria: 'servico' | 'produto' } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPhotoAdjustment, setShowPhotoAdjustment] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showClientPopup) {
      setTimeout(() => {
        clientSearchRef.current?.focus();
      }, 100);
    }
  }, [showClientPopup]);
  const [newClient, setNewClient] = useState({ nome: '', tel: '' });
  const [visibleRecords, setVisibleRecords] = useState(10);
  const [selectedRecurrence, setSelectedRecurrence] = useState<number>(0);
  const [aiInsights, setAiInsights] = useState<{ title: string, description: string }[]>([]);
  const [marketTrends, setMarketTrends] = useState<{ title: string, description: string, url?: string }[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Calculations
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthRecords = data.historico.filter(r => {
      const datePart = r.data.split('T')[0];
      const [year, month] = datePart.split('-').map(Number);
      return (month - 1) === currentMonth && year === currentYear;
    });

    const faturamentoServicos = monthRecords
      .filter(r => r.tipo === 'entrada' && (r.categoria === 'servico' || !r.categoria))
      .reduce((acc, r) => acc + r.valor, 0);

    const faturamentoProdutos = monthRecords
      .filter(r => r.tipo === 'entrada' && r.categoria === 'produto')
      .reduce((acc, r) => acc + r.valor, 0);

    const comissaoServicos = (faturamentoServicos * data.percentualGanho) / 100;
    const comissaoProdutos = (faturamentoProdutos * (data.percentualProdutos || 0)) / 100;

    return { 
      faturamento: faturamentoServicos + faturamentoProdutos, 
      comissao: comissaoServicos + comissaoProdutos 
    };
  }, [data]);

  // Fetch AI Insights & Market Trends
  useEffect(() => {
    if (isLoggedIn && mainTab === 'inicio') {
      const fetchData = async () => {
        setLoadingAI(true);
        setLoadingTrends(true);
        
        const [insightsResult, trendsResult] = await Promise.all([
          getAIInsights({
            saldo: data.saldo,
            meta: data.meta,
            faturamento: monthlyStats.faturamento,
            comissao: monthlyStats.comissao,
            servicosCount: data.servicos.length,
            produtosCount: data.produtos.length
          }),
          getMarketTrends()
        ]);

        if (insightsResult.insights) {
          setAiInsights(insightsResult.insights);
        }
        if (trendsResult.trends) {
          setMarketTrends(trendsResult.trends);
        }
        
        setLoadingAI(false);
        setLoadingTrends(false);
      };
      fetchData();
    }
  }, [isLoggedIn, mainTab, data.saldo, data.meta, monthlyStats.faturamento]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const faturamento = data.historico
        .filter(r => {
          const datePart = r.data.split('T')[0];
          const [year, month] = datePart.split('-').map(Number);
          return (month - 1) === index && year === currentYear && r.tipo === 'entrada';
        })
        .reduce((acc, r) => acc + r.valor, 0);
      
      return { name: month, valor: faturamento };
    });

    const yearlyData = Array.from({ length: 5 }).map((_, i) => {
      const year = currentYear - (4 - i);
      const faturamento = data.historico
        .filter(r => {
          const year = Number(r.data.split('-')[0]);
          return year === currentYear - (4 - i) && r.tipo === 'entrada';
        })
        .reduce((acc, r) => acc + r.valor, 0);
      
      return { name: year.toString(), valor: faturamento };
    });

    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const faturamento = data.historico
        .filter(r => {
          const datePart = r.data.split('T')[0];
          const [y, m, d] = datePart.split('-').map(Number);
          return y === currentYear && (m - 1) === currentMonth && d === day && r.tipo === 'entrada';
        })
        .reduce((acc, r) => acc + r.valor, 0);
      return { name: day.toString(), valor: faturamento };
    });

    const goalsData = months.map((month, index) => {
      const faturamento = data.historico
        .filter(r => {
          const datePart = r.data.split('T')[0];
          const [year, month] = datePart.split('-').map(Number);
          return (month - 1) === index && year === currentYear && r.tipo === 'entrada';
        })
        .reduce((acc, r) => acc + r.valor, 0);
      return { name: month, faturamento, meta: data.meta };
    });

    return { monthlyData, yearlyData, dailyData, goalsData };
  }, [data.historico, data.meta]);

  const metaProgress = useMemo(() => {
    if (data.meta <= 0) return 0;
    return Math.min(100, (data.saldo / data.meta) * 100);
  }, [data.saldo, data.meta]);

  const upcomingReturns = useMemo(() => {
    const now = new Date();
    const clientLastVisits = new Map<string, { date: Date, recurrence: number, name: string }>();
    
    data.historico.forEach(r => {
      if (r.clienteNome && r.recorrencia && r.tipo === 'entrada') {
        const last = clientLastVisits.get(r.clienteNome);
        const datePart = r.data.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const current = new Date(year, month - 1, day);
        if (!last || current > last.date) {
          clientLastVisits.set(r.clienteNome, { date: current, recurrence: r.recorrencia, name: r.clienteNome });
        }
      }
    });

    return Array.from(clientLastVisits.values())
      .map(v => {
        const nextDate = new Date(v.date);
        nextDate.setDate(nextDate.getDate() + v.recurrence);
        const daysRemaining = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...v, nextDate, daysRemaining };
      })
      .filter(v => v.daysRemaining >= -7 && v.daysRemaining <= 14)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [data.historico]);

  // Actions
  const addRecord = (valor: number, descricao: string, cliente?: { nome: string, tel: string }, recorrencia?: number, categoria: 'servico' | 'produto' = 'servico') => {
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1];
    const dateStr = selectedDate ? `${selectedDate}T${timeStr}` : now.toISOString();

    const newRecord: HistoryRecord = {
      id: Date.now(),
      descricao,
      valor,
      tipo: 'entrada',
      data: dateStr,
      clienteNome: cliente?.nome || null,
      clienteTelefone: cliente?.tel || null,
      recorrencia: recorrencia || undefined,
      categoria
    };

    setData(prev => {
      let updatedContatos = prev.contatos;
      if (cliente && recorrencia) {
        updatedContatos = prev.contatos.map(c => 
          c.nome === cliente.nome && c.telefone === cliente.tel 
            ? { ...c, recorrenciaPadrao: recorrencia, atualizadoEm: Date.now() }
            : c
        );
      }

      return {
        ...prev,
        saldo: prev.saldo + valor,
        historico: [newRecord, ...prev.historico],
        contatos: updatedContatos
      };
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setShowPhotoAdjustment(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((file) => {
        if (file) {
          resolve(URL.createObjectURL(file));
        }
      }, 'image/jpeg');
    });
  };

  const saveAdjustedPhoto = async () => {
    if (showPhotoAdjustment && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(showPhotoAdjustment, croppedAreaPixels);
      if (croppedImage) {
        setData(prev => ({ ...prev, perfilUrl: croppedImage }));
        setShowPhotoAdjustment(null);
      }
    }
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
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${darkMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-50 text-slate-900'}`}>
      {/* Elementos Atmosféricos de Fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[45%] bg-[#8b5cf6]/8 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] bg-cyan-400/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-6 relative z-10">
        
        {/* Header Unificado */}
        <header className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 group transition-all"
          >
            <div className="relative">
              <img 
                src={data.perfilUrl || "https://picsum.photos/seed/barber/100/100"} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-emerald-500 p-0.5 object-cover group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-black tracking-tight leading-tight text-slate-900">Flow Barber</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Studio</p>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-20 left-6 z-[60] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-slate-100 p-6 w-80 space-y-6"
              >
                <div className="border-b border-slate-50 pb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel de Controle</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comissão Serviços</h4>
                      <span className="text-sm font-black text-emerald-500">{data.percentualGanho}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={data.percentualGanho}
                      onChange={(e) => setData(prev => ({ ...prev, percentualGanho: Number(e.target.value) }))}
                      className="w-full accent-emerald-500 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comissão Produtos</h4>
                      <span className="text-sm font-black text-cyan-500">{data.percentualProdutos}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={data.percentualProdutos}
                      onChange={(e) => setData(prev => ({ ...prev, percentualProdutos: Number(e.target.value) }))}
                      className="w-full accent-cyan-500 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-600 font-bold text-sm"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Users size={16} /></div>
                    Alterar Foto
                  </button>
                  <button 
                    onClick={() => { setShowFolgaPopup(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-600 font-bold text-sm"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Calendar size={16} /></div>
                    Dias de Folga
                  </button>
                  <button 
                    onClick={() => { setShowMetaPopup(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-600 font-bold text-sm"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Target size={16} /></div>
                    Ajustar Meta
                  </button>
                  <button 
                    onClick={() => { setShowSettingsPopup(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-600 font-bold text-sm"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Settings size={16} /></div>
                    Catálogo de Preços
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => setIsLoggedIn(false)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-2xl transition-all text-red-500 font-bold text-sm"
                  >
                    <div className="p-2 bg-red-50 rounded-xl text-red-400"><LogOut size={16} /></div>
                    Sair do Sistema
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <AnimatePresence mode="wait">
          {mainTab === 'inicio' && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Saldo Principal - Reduzido */}
              <Card className="bg-white border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[32px] p-8 text-slate-900 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Saldo Disponível</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-200">R$</span>
                    <h3 className="text-6xl font-black tracking-tighter text-slate-900 leading-none select-none">
                      {Math.floor(data.saldo)}
                      <span className="text-2xl opacity-40">,{(data.saldo % 1).toFixed(2).split('.')[1]}</span>
                    </h3>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-6 -translate-y-1/2 opacity-[0.02] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <Scissors size={140} strokeWidth={1} />
                </div>
              </Card>

              {/* Ganhos e Meta - Compactos */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white border-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-5">
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-2">Ganhos</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-black text-slate-200">R$</span>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{monthlyStats.comissao.toLocaleString('pt-BR')}</h4>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{data.percentualGanho}% COMISSÃO</span>
                  </div>
                </Card>

                <Card className="bg-white border-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-5">
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-2">Meta</p>
                  <div className="flex items-start gap-1">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{formatCurrency(data.saldo).split(',')[0]}</h4>
                    <span className="text-slate-300 font-black text-[10px] leading-none mt-0.5">/ {formatCurrency(data.meta).split(',')[0]}</span>
                  </div>
                  <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metaProgress}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </Card>
              </div>

              {/* AI Insights & Market Trends */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-gradient-to-br from-[#8b5cf6]/5 to-emerald-500/5 border border-[#8b5cf6]/10 rounded-[32px] p-8 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">AI Insights</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gemini Intelligence</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingAI ? (
                      [1, 2, 3].map(i => (
                        <div key={i} className="space-y-3 animate-pulse">
                          <div className="h-4 w-24 bg-slate-200 rounded-full" />
                          <div className="h-3 w-full bg-slate-100 rounded-full" />
                        </div>
                      ))
                    ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                        <div key={i} className="space-y-2">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{insight.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum insight disponível no momento.</p>
                    )}
                  </div>
                </Card>

                {/* Market Trends - Google Search Grounding */}
                <Card className="bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 border border-cyan-500/10 rounded-[32px] p-8 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-xl">
                      <Search size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Tendências do Mercado</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Google Search Grounding</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingTrends ? (
                      [1, 2, 3].map(i => (
                        <div key={i} className="space-y-3 animate-pulse">
                          <div className="h-4 w-24 bg-slate-200 rounded-full" />
                          <div className="h-3 w-full bg-slate-100 rounded-full" />
                        </div>
                      ))
                    ) : marketTrends.length > 0 ? (
                      marketTrends.map((trend, i) => (
                        <div key={i} className="space-y-2">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{trend.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{trend.description}</p>
                          {trend.url && (
                            <a 
                              href={trend.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:underline"
                            >
                              Ver mais
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Buscando tendências...</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Seletor de Serviços/Produtos - Grid Colmeia */}
              <Card className="bg-slate-100/30 border-none rounded-[32px] p-6 overflow-hidden">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-[20px] border border-slate-200/50">
                    <button
                      onClick={() => setActiveTab('servicos')}
                      className={`px-6 py-2.5 rounded-[16px] text-[9px] font-black transition-all ${
                        activeTab === 'servicos' 
                          ? 'bg-white text-[#8b5cf6] shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      SERVIÇOS
                    </button>
                    <button
                      onClick={() => setActiveTab('produtos')}
                      className={`px-6 py-2.5 rounded-[16px] text-[9px] font-black transition-all ${
                        activeTab === 'produtos' 
                          ? 'bg-white text-[#22d3ee] shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      PRODUTOS
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {(activeTab === 'servicos' ? data.servicos : data.produtos).map((item, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setPendingService({ ...item, categoria: activeTab === 'servicos' ? 'servico' : 'produto' });
                          setShowClientPopup(true);
                        }}
                        className="flex flex-col items-center justify-center p-4 rounded-[24px] bg-white shadow-sm border border-slate-100 hover:border-emerald-500/30 transition-all aspect-square text-center group"
                      >
                        <div className={`p-2 rounded-xl mb-2 transition-colors ${
                          activeTab === 'servicos' ? 'bg-[#8b5cf6]/5 text-[#8b5cf6]' : 'bg-[#22d3ee]/5 text-[#22d3ee]'
                        }`}>
                          {activeTab === 'servicos' ? <Scissors size={16} /> : <Package size={16} />}
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter line-clamp-1">{item.nome}</span>
                        <span className="text-xs font-black text-slate-900 mt-1">R${Math.floor(item.valor)}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </Card>
            </motion.div>
          )}

          {mainTab === 'agenda' && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <CalendarGrid 
                data={data} 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
                onShowFolgas={() => setShowFolgaPopup(true)}
                onClearMonth={(month, year) => {
                  if (confirm('Deseja realmente limpar o histórico deste mês?')) {
                    setData(prev => ({
                      ...prev,
                      historico: prev.historico.filter(r => {
                        const [y, m] = r.data.split('T')[0].split('-').map(Number);
                        return !((m - 1) === month && y === year);
                      })
                    }));
                  }
                }}
                onClearDay={(date) => {
                  if (confirm('Deseja realmente limpar o histórico deste dia?')) {
                    setData(prev => ({
                      ...prev,
                      historico: prev.historico.filter(r => r.data.split('T')[0] !== date)
                    }));
                  }
                }}
              />
            </motion.div>
          )}

          {mainTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <ChartColumn size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento por Dia (Mês Atual)</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontWeight: 900 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `R$${value}`}
                        tick={{ fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#10b981', fontWeight: '900' }}
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      />
                      <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                    <Target size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento vs Meta</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.goalsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontWeight: 900 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `R$${value}`}
                        tick={{ fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: '900' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="faturamento" fill="#10b981" radius={[8, 8, 0, 0]} name="Realizado" />
                      <Bar dataKey="meta" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Meta" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <ChartColumn size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento Mensal</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontWeight: 900 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `R$${value}`}
                        tick={{ fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#10b981', fontWeight: '900' }}
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                        {chartData.monthlyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#10b981' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento Anual</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.yearlyData}>
                      <defs>
                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontWeight: 900 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `R$${value}`}
                        tick={{ fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      />
                      <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {mainTab === 'historico' && (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} tick={{ fontWeight: 900 }} />
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
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} tick={{ fontWeight: 900 }} />
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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                      <History size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Histórico de Atividades</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {data.historico
                      .filter(r => !selectedDate || r.data.split('T')[0] === selectedDate)
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
                                  {new Date(r.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(r.data).toLocaleDateString('pt-BR')}
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
                            <button 
                              onClick={() => deleteRecord(r.id)}
                              className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-xl shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                  
                  {data.historico.filter(r => !selectedDate || r.data.split('T')[0] === selectedDate).length > visibleRecords && (
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
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Integrada */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 pt-2 pb-6 sm:pb-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <NavButton 
            active={mainTab === 'inicio'} 
            onClick={() => setMainTab('inicio')} 
            icon={<LayoutGrid size={24} />} 
            label="Início" 
          />
          <NavButton 
            active={mainTab === 'agenda'} 
            onClick={() => setMainTab('agenda')} 
            icon={<Calendar size={24} />} 
            label="Agenda" 
          />
          <NavButton 
            active={mainTab === 'analytics'} 
            onClick={() => setMainTab('analytics')} 
            icon={<ChartColumn size={24} />} 
            label="Analytics" 
          />
          <NavButton 
            active={mainTab === 'historico'} 
            onClick={() => setMainTab('historico')} 
            icon={<Clock size={24} />} 
            label="Histórico" 
          />
        </div>
      </nav>

      {/* Popups */}
      <AnimatePresence>
        {showMetaPopup && (
          <Popup title="Editar Meta" onClose={() => setShowMetaPopup(false)}>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Valor da Meta (R$)</label>
                <input 
                  type="number" 
                  defaultValue={data.meta}
                  onBlur={(e) => setData(prev => ({ ...prev, meta: Number(e.target.value) }))}
                  className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-black text-2xl text-slate-900 text-center"
                />
              </div>
              <button onClick={() => setShowMetaPopup(false)} className="btn-primary w-full py-5 rounded-[32px] uppercase tracking-widest text-xs font-black">Salvar Meta</button>
            </div>
          </Popup>
        )}

        {showSettingsPopup && (
          <Popup title="Catálogo e Comissões" onClose={() => setShowSettingsPopup(false)}>
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Comissões */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Serviços</h4>
                    <span className="text-xl font-black text-emerald-500">{data.percentualGanho}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={data.percentualGanho}
                    onChange={(e) => setData(prev => ({ ...prev, percentualGanho: Number(e.target.value) }))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  />
                </div>
                <div className="p-5 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produtos</h4>
                    <span className="text-xl font-black text-cyan-500">{data.percentualProdutos}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={data.percentualProdutos}
                    onChange={(e) => setData(prev => ({ ...prev, percentualProdutos: Number(e.target.value) }))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Serviços */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Serviços</h4>
                  <span className="text-[10px] font-black text-slate-400">{data.servicos.length} itens</span>
                </div>
                <div className="space-y-3">
                  {data.servicos.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                      <input 
                        type="text" 
                        value={s.nome}
                        onChange={(e) => {
                          const newServicos = [...data.servicos];
                          newServicos[i].nome = e.target.value;
                          setData(prev => ({ ...prev, servicos: newServicos }));
                        }}
                        className="flex-1 p-3 rounded-xl bg-transparent font-black text-sm text-slate-900 outline-none"
                      />
                      <div className="flex items-center bg-white rounded-xl px-3 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 mr-1">R$</span>
                        <input 
                          type="number" 
                          value={s.valor}
                          onChange={(e) => {
                            const newServicos = [...data.servicos];
                            newServicos[i].valor = Number(e.target.value);
                            setData(prev => ({ ...prev, servicos: newServicos }));
                          }}
                          className="w-16 p-3 bg-transparent font-black text-sm text-emerald-500 outline-none text-right"
                        />
                      </div>
                      <button 
                        onClick={() => setData(prev => ({ ...prev, servicos: prev.servicos.filter((_, idx) => idx !== i) }))}
                        className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setData(prev => ({ ...prev, servicos: [...prev.servicos, { nome: 'Novo Serviço', valor: 0 }] }))}
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-black text-xs hover:border-emerald-500/30 hover:text-emerald-500 transition-all uppercase tracking-widest"
                >
                  <Plus size={18} /> Adicionar Serviço
                </button>
              </div>

              {/* Produtos */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Produtos</h4>
                  <span className="text-[10px] font-black text-slate-400">{data.produtos.length} itens</span>
                </div>
                <div className="space-y-3">
                  {data.produtos.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                      <input 
                        type="text" 
                        value={p.nome}
                        onChange={(e) => {
                          const newProdutos = [...data.produtos];
                          newProdutos[i].nome = e.target.value;
                          setData(prev => ({ ...prev, produtos: newProdutos }));
                        }}
                        className="flex-1 p-3 rounded-xl bg-transparent font-black text-sm text-slate-900 outline-none"
                      />
                      <div className="flex items-center bg-white rounded-xl px-3 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 mr-1">R$</span>
                        <input 
                          type="number" 
                          value={p.valor}
                          onChange={(e) => {
                            const newProdutos = [...data.produtos];
                            newProdutos[i].valor = Number(e.target.value);
                            setData(prev => ({ ...prev, produtos: newProdutos }));
                          }}
                          className="w-16 p-3 bg-transparent font-black text-sm text-cyan-500 outline-none text-right"
                        />
                      </div>
                      <button 
                        onClick={() => setData(prev => ({ ...prev, produtos: prev.produtos.filter((_, idx) => idx !== i) }))}
                        className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setData(prev => ({ ...prev, produtos: [...prev.produtos, { nome: 'Novo Produto', valor: 0 }] }))}
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-black text-xs hover:border-cyan-500/30 hover:text-cyan-500 transition-all uppercase tracking-widest"
                >
                  <Plus size={18} /> Adicionar Produto
                </button>
              </div>
            </div>
          </Popup>
        )}

        {showFolgaPopup && (
          <Popup title="Dias de Folga" onClose={() => setShowFolgaPopup(false)}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, i) => {
                  const config = data.diasFolga.find(d => d.dia === i);
                  return (
                    <div key={dia} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                      <div className="flex items-center gap-4">
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
                          className="w-6 h-6 rounded-xl accent-emerald-500 bg-white border-slate-200"
                        />
                        <span className="font-black text-slate-900 tracking-tight">{dia}</span>
                      </div>
                      {config && (
                        <select 
                          value={config.periodo}
                          onChange={(e) => {
                            const newFolgas = data.diasFolga.map(d => d.dia === i ? { ...d, periodo: e.target.value as any } : d);
                            setData(prev => ({ ...prev, diasFolga: newFolgas }));
                          }}
                          className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-emerald-500 transition-all"
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
              <button onClick={() => setShowFolgaPopup(false)} className="btn-primary w-full py-5 rounded-[32px]">Salvar Configurações</button>
            </div>
          </Popup>
        )}

        {showClientPopup && pendingService && (
          <Popup title="Confirmar Registro" onClose={() => {
            setShowClientPopup(false);
            setNewClient({ nome: '', tel: '' });
            setClientSearch('');
          }}>
            <div className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{pendingService.categoria === 'produto' ? 'Produto' : 'Serviço'}</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">{pendingService.nome}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${pendingService.categoria === 'produto' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                    {formatCurrency(pendingService.valor)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recorrência Sugerida</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 7, 15, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setSelectedRecurrence(days)}
                        className={`py-3 rounded-2xl text-xs font-black transition-all border ${
                          selectedRecurrence === days 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {days === 0 ? 'Nenhuma' : `${days}d`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Buscar Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      ref={clientSearchRef}
                      type="text" 
                      placeholder="Nome ou telefone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {clientSearch && (
                  <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-[32px] border border-slate-100 custom-scrollbar">
                    {data.contatos
                      .filter(c => c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || c.telefone.includes(clientSearch))
                      .map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            const recurrence = selectedRecurrence || c.recorrenciaPadrao || 0;
                            addRecord(pendingService!.valor, pendingService!.nome, { nome: c.nome, tel: c.telefone }, recurrence || undefined, pendingService!.categoria);
                            setShowClientPopup(false);
                            setClientSearch('');
                            setSelectedRecurrence(0);
                          }}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 transition-all border border-transparent hover:border-emerald-500/30 group"
                        >
                          <div className="text-left">
                            <p className="font-black text-slate-900 tracking-tight">{c.nome}</p>
                            <p className="text-[10px] font-bold text-slate-500">{c.telefone}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Plus size={16} />
                          </div>
                        </button>
                      ))}
                    {data.contatos.filter(c => c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || c.telefone.includes(clientSearch)).length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nenhum cliente encontrado</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Nome do novo cliente"
                        value={newClient.nome}
                        onChange={(e) => setNewClient(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-sm"
                      />
                      <input 
                        type="tel" 
                        placeholder="Telefone (opcional)"
                        value={newClient.tel}
                        onChange={(e) => setNewClient(prev => ({ ...prev, tel: e.target.value }))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-sm"
                      />
                    </div>
                    
                    <button 
                      disabled={!newClient.nome}
                      onClick={() => {
                        const contact: Contact = {
                          id: Date.now(),
                          nome: newClient.nome,
                          telefone: newClient.tel,
                          criadoEm: Date.now(),
                          atualizadoEm: Date.now(),
                          recorrenciaPadrao: selectedRecurrence || undefined
                        };
                        setData(prev => ({
                          ...prev,
                          contatos: [contact, ...prev.contatos]
                        }));
                        addRecord(pendingService!.valor, pendingService!.nome, { nome: newClient.nome, tel: newClient.tel }, selectedRecurrence, pendingService!.categoria);
                        setShowClientPopup(false);
                        setNewClient({ nome: '', tel: '' });
                        setSelectedRecurrence(0);
                      }}
                      className="w-full py-5 bg-emerald-500 text-white font-black rounded-[32px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-xs"
                    >
                      Registrar e Salvar Cliente
                    </button>
                    
                    <button 
                      onClick={() => {
                        addRecord(pendingService!.valor, pendingService!.nome, undefined, undefined, pendingService!.categoria);
                        setShowClientPopup(false);
                      }}
                      className="w-full py-4 text-[10px] text-slate-500 font-black hover:text-slate-400 transition-all uppercase tracking-widest"
                    >
                      Registrar sem cliente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-5 rounded-[32px] shadow-[0_20px_40px_rgba(16,185,129,0.4)] flex items-center gap-4 border-2 border-emerald-400/30"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                className="bg-white text-emerald-500 p-2 rounded-full shadow-inner"
              >
                <CheckCircle2 size={24} strokeWidth={3} />
              </motion.div>
              <span className="font-black text-base uppercase tracking-widest">Adicionado com Sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Adjustment Popup */}
        <AnimatePresence>
          {showPhotoAdjustment && (
            <Popup title="Ajustar Foto" onClose={() => setShowPhotoAdjustment(false)}>
              <div className="space-y-8">
                <div className="aspect-square w-full max-w-[300px] mx-auto overflow-hidden rounded-[40px] border-4 border-emerald-500/20 shadow-2xl relative group bg-black">
                  <Cropper
                    image={showPhotoAdjustment}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="px-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Zoom</label>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest px-8">
                    Sua foto será salva como imagem de perfil do Flow Barber.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowPhotoAdjustment(false)}
                      className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-[24px] hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={saveAdjustedPhoto}
                      className="flex-2 py-5 bg-emerald-500 text-white font-black rounded-[24px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                    >
                      Confirmar e Salvar
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </AnimatePresence>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handlePhotoUpload}
        />
    </div>
  );
}

// --- Subcomponents ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all relative ${
      active ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'
    }`}
  >
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-dot"
        className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"
      />
    )}
  </button>
);

const CalendarGrid = ({ data, selectedDate, onSelectDate, onShowFolgas, onClearMonth, onClearDay }: { data: AppData, selectedDate: string | null, onSelectDate: (d: string | null) => void, onShowFolgas: () => void, onClearMonth: (month: number, year: number) => void, onClearDay: (date: string) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, currentMonth));

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
      const isFolga = data.diasFolga.some(df => df.dia === date.getDay());
      if (isFolga) folgasCount++;
    }

    return { totalEntradas, daysWorked, folgasCount };
  }, [data.historico, data.diasFolga, currentMonth, currentYear, daysInMonth]);

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
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
          <ChevronLeftIcon size={24} />
        </button>
        <div className="text-center relative">
          <h2 className="text-3xl font-black text-slate-900 capitalize">{monthName}</h2>
          <div className="flex items-center justify-center gap-2">
            <p className="text-slate-400 font-bold">{currentYear}</p>
            <button 
              onClick={() => dateInputRef.current?.showPicker()}
              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
            >
              <Calendar size={16} />
            </button>
            <input 
              type="date" 
              ref={dateInputRef} 
              className="absolute opacity-0 pointer-events-none" 
              onChange={handleDateInput}
            />
          </div>
        </div>
        <button onClick={() => changeMonth(1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
          <ChevronRightIcon size={24} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entradas</p>
          <p className="text-lg font-black text-slate-900">{formatCurrency(monthStats.totalEntradas).split(',')[0]}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Briefcase size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabalhados</p>
          <p className="text-lg font-black text-slate-900">{monthStats.daysWorked} dias</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Coffee size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folgas</p>
          <p className="text-lg font-black text-slate-900">{monthStats.folgasCount} dias</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onShowFolgas}
          className="col-span-2 py-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-3 text-slate-500 font-black hover:bg-slate-50 transition-all shadow-sm"
        >
          <Moon size={20} />
          Marcar folga
        </button>
        <button 
          onClick={() => onClearMonth(currentMonth, currentYear)}
          className="py-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-2 text-orange-500 font-black hover:bg-orange-50 transition-all shadow-sm uppercase tracking-widest text-[10px]"
        >
          <Trash2 size={16} />
          Zerar Mês
        </button>
        <button 
          onClick={() => selectedDate ? onClearDay(selectedDate) : null}
          disabled={!selectedDate}
          className={`py-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-2 font-black transition-all shadow-sm uppercase tracking-widest text-[10px] ${selectedDate ? 'text-red-500 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}
        >
          <Trash2 size={16} />
          Zerar Dia
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm">
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
            const folga = data.diasFolga.find(d => d.dia === date.getDay());
            const isToday = getLocalISO(new Date()) === dateKey;

            return (
              <button
                key={day}
                onClick={() => onSelectDate(isSelected ? null : dateKey)}
                className={`
                  relative flex flex-col items-center justify-center rounded-2xl transition-all h-16 border
                  ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 
                    isToday ? 'border-indigo-500/50 bg-indigo-500/5' : 
                    'border-transparent bg-slate-50 hover:bg-slate-100'}
                  ${folga?.periodo === 'completo' ? 'opacity-60 grayscale-[0.3]' : ''}
                `}
              >
                <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                   {stats && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                   {folga?.periodo === 'completo' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                   {folga?.periodo === 'manha' && <div className="w-1.5 h-1.5 rounded-t-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                   {folga?.periodo === 'tarde' && <div className="w-1.5 h-1.5 rounded-b-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                </div>

                <span className={`text-xs font-black ${isSelected ? 'text-emerald-500' : isToday ? 'text-indigo-500' : 'text-slate-900'}`}>
                  {day}
                </span>
                
                {stats && (
                  <span className="text-[8px] font-black text-emerald-500/80 mt-0.5">
                    R${Math.round(stats.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agendado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Folga (Dia)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-t-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Folga (Manhã)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-b-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Folga (Tarde)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hoje</span>
        </div>
      </div>

      {/* Selected Day Details */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                Agenda: {selectedDate.split('-').reverse().join('/')}
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-500">
                    {formatCurrency(dailyData[selectedDate]?.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {data.historico
                .filter(r => r.data.split('T')[0] === selectedDate)
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${r.categoria === 'produto' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        {r.categoria === 'produto' ? <DollarSign size={14} /> : <Scissors size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{r.descricao}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {r.clienteNome || 'Cliente não identificado'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-black text-emerald-500`}>
                      {formatCurrency(r.valor)}
                    </span>
                  </div>
                ))}
              
              {(!dailyData[selectedDate] || dailyData[selectedDate].count === 0) && (
                <div className="text-center py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400">Nenhum agendamento para este dia.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Popup = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 sm:pb-8 space-y-6 border-t sm:border border-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.15)]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <button 
          onClick={onClose} 
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400"
        >
          <Plus className="rotate-45" size={24} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar text-slate-900">
        {children}
      </div>
    </motion.div>
  </motion.div>
);

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleAuth = () => {
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('flowBarberUsers') || '{}');

    if (isSignUp) {
      if (users[username]) {
        setError('Usuário já existe.');
        return;
      }
      users[username] = password;
      localStorage.setItem('flowBarberUsers', JSON.stringify(users));
      localStorage.setItem('flowBarberCurrentUser', username);
      onLogin();
    } else {
      if (users[username] === password) {
        localStorage.setItem('flowBarberCurrentUser', username);
        onLogin();
      } else {
        setError('Usuário ou senha incorretos.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20 mb-4">
            <Scissors size={48} className="text-emerald-500" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Flow Barber</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Premium Studio Management</p>
        </div>

        <div className="bg-white border border-slate-100 p-10 space-y-8 rounded-[40px] shadow-[0_30px_80px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-400" />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Usuário</label>
              <input 
                type="text" 
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-5 rounded-[24px] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Senha</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-5 rounded-[24px] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300"
              />
            </div>

            {error && (
              <p className="text-center text-xs font-black text-red-500 uppercase tracking-widest animate-pulse">{error}</p>
            )}
            
            <button 
              onClick={handleAuth}
              className="w-full bg-emerald-500 text-white font-black py-5 rounded-[24px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm mt-6 uppercase tracking-widest"
            >
              {isSignUp ? 'Criar Minha Conta' : 'Acessar Painel'}
            </button>
          </div>

          <div className="pt-6 border-t border-slate-50 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-widest"
            >
              {isSignUp ? 'Já tenho uma conta? Entrar' : 'Não tem conta? Começar agora'}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
          &copy; 2026 Flow Barber &bull; Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
