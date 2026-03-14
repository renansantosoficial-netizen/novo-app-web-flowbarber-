/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
  AlertCircle,
  Moon,
  Sun,
  Briefcase,
  Coffee,
  Package,
  Sparkles,
  Pencil,
  Download,
  X,
  FileText,
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
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card } from './components/Card';
import { MetricsSection } from './components/MetricsSection';
import { MetricsDrawer } from './components/MetricsDrawer';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, DayOffConfig } from './types';
import { getAIInsights, getMarketTrends } from './services/geminiService';
import Cropper from 'react-easy-crop';

// --- Utils ---
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatCurrency = (v: number) => 
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

const getLocalISO = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

// --- Components ---



const AnimatedTitle = ({ text }: { text: string }) => {
  const characters = Array.from(text);
  return (
    <div className="flex justify-center overflow-hidden">
      {characters.map((char, i) => (
        <motion.span
          key={`char-${i}`}
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

import { ReportModal } from './components/ReportModal';
import { ServiceModal } from './components/ServiceModal';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('flowBarberData');
    if (!saved) return DEFAULT_DATA;
    try {
      const parsed = JSON.parse(saved);
      
      // Ensure unique IDs for history and contacts
      const historico = (parsed.historico || DEFAULT_DATA.historico).map((r: any, i: number) => {
        const isDuplicate = parsed.historico && parsed.historico.slice(0, i).some((prev: any) => prev.id === r.id);
        return {
          ...r,
          id: (r.id && !isDuplicate) ? r.id : generateId()
        };
      });

      const contatos = (parsed.contatos || DEFAULT_DATA.contatos).map((c: any, i: number) => {
        const isDuplicate = parsed.contatos && parsed.contatos.slice(0, i).some((prev: any) => prev.id === c.id);
        return {
          ...c,
          id: (c.id && !isDuplicate) ? c.id : generateId()
        };
      });

      const servicos = (parsed.servicos || DEFAULT_DATA.servicos).map((s: any, i: number) => {
        const isDuplicate = parsed.servicos && parsed.servicos.slice(0, i).some((prev: any) => prev.id === s.id);
        return {
          ...s,
          id: (s.id && !isDuplicate) ? s.id : generateId()
        };
      });

      const produtos = (parsed.produtos || DEFAULT_DATA.produtos).map((p: any, i: number) => {
        const isDuplicate = parsed.produtos && parsed.produtos.slice(0, i).some((prev: any) => prev.id === p.id);
        return {
          ...p,
          id: (p.id && !isDuplicate) ? p.id : generateId()
        };
      });

      // Merge with DEFAULT_DATA to ensure new fields exist
      return {
        ...DEFAULT_DATA,
        ...parsed,
        historico,
        contatos,
        servicos,
        produtos,
        diasFolga: (parsed.diasFolga || DEFAULT_DATA.diasFolga).filter((d: any) => d.dia !== 0 && d.dia !== 2),
        percentualGanho: parsed.percentualGanho ?? DEFAULT_DATA.percentualGanho,
        percentualProdutos: parsed.percentualProdutos ?? DEFAULT_DATA.percentualProdutos,
        saldo: parsed.saldo ?? DEFAULT_DATA.saldo,
        meta: parsed.meta ?? DEFAULT_DATA.meta,
      };
    } catch (e) {
      return DEFAULT_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('flowBarberData', JSON.stringify(data));
  }, [data]);

  const exportToCSV = (data: any[], filename: string, isHistory: boolean = false) => {
    if (data.length === 0) return;
    
    let csvContent = "";
    if (isHistory) {
      const headers = ['Data', 'Tipo', 'Descricao', 'Valor', 'Categoria'].join(',');
      const rows = data.map(r => [
        `"${new Date(r.data).toLocaleString('pt-BR')}"`,
        `"${r.tipo}"`,
        `"${r.descricao}"`,
        `"${r.valor}"`,
        `"${r.categoria || ''}"`
      ].join(','));
      csvContent = [headers, ...rows].join('\n');
    } else {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
      csvContent = [headers, ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Dados", 10, 10);
    
    // Add summary
    doc.text(`Saldo: € ${totalBalance.toFixed(2)}`, 10, 20);
    doc.text(`Meta: € ${data.meta.toFixed(2)}`, 10, 30);
    
    // Add tables
    (doc as any).autoTable({
      head: [['Nome', 'Valor']],
      body: data.servicos.map(s => [s.nome, `€ ${s.valor.toFixed(2)}`]),
      startY: 40,
    });
    
    doc.save('relatorio.pdf');
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('flowBarberLoggedIn') === '1');
  const [darkMode, setDarkMode] = useState(true);
  const [mainTab, setMainTab] = useState<'inicio' | 'agenda' | 'analytics' | 'historico' | 'config'>('inicio');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showMetricsDrawer, setShowMetricsDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

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
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'catalogo' | 'metas' | 'folgas' | 'perfil'>('catalogo');
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [pendingService, setPendingService] = useState<{ nome: string, valor: number, categoria: 'servico' | 'produto' } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<HistoryRecord | null>(null);
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

  const dailyStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = data.historico.filter(r => r.data.startsWith(today));

    const faturamentoServicos = todayRecords
      .filter(r => r.tipo === 'entrada' && (r.categoria === 'servico' || !r.categoria))
      .reduce((acc, r) => acc + r.valor, 0);

    const faturamentoProdutos = todayRecords
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
    if (isLoggedIn && mainTab === 'inicio' && aiInsights.length === 0 && marketTrends.length === 0) {
      const fetchData = async () => {
        const cachedAI = localStorage.getItem('flowBarberAIInsights');
        const cachedTrends = localStorage.getItem('flowBarberMarketTrends');
        const cacheTime = localStorage.getItem('flowBarberCacheTime');
        
        const now = new Date().getTime();
        const isCacheValid = cacheTime && (now - parseInt(cacheTime)) < 24 * 60 * 60 * 1000; // 24 hours

        if (isCacheValid && cachedAI && cachedTrends) {
          setAiInsights(JSON.parse(cachedAI));
          setMarketTrends(JSON.parse(cachedTrends));
          return;
        }

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
          localStorage.setItem('flowBarberAIInsights', JSON.stringify(insightsResult.insights));
        }
        if (trendsResult.trends) {
          setMarketTrends(trendsResult.trends);
          localStorage.setItem('flowBarberMarketTrends', JSON.stringify(trendsResult.trends));
        }
        
        localStorage.setItem('flowBarberCacheTime', now.toString());
        
        setLoadingAI(false);
        setLoadingTrends(false);
      };
      fetchData();
    }
  }, [isLoggedIn, mainTab, data.saldo, data.meta, monthlyStats.faturamento, aiInsights.length, marketTrends.length]);

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

    const categoryData = {
      totalServicos: data.historico.filter(r => r.tipo === 'entrada' && r.categoria === 'servico').reduce((acc, r) => acc + r.valor, 0),
      totalProdutos: data.historico.filter(r => r.tipo === 'entrada' && r.categoria === 'produto').reduce((acc, r) => acc + r.valor, 0),
      total: 0,
      percentServicos: 0,
      percentProdutos: 0
    };
    categoryData.total = categoryData.totalServicos + categoryData.totalProdutos;
    categoryData.percentServicos = categoryData.total > 0 ? (categoryData.totalServicos / categoryData.total) * 100 : 0;
    categoryData.percentProdutos = categoryData.total > 0 ? (categoryData.totalProdutos / categoryData.total) * 100 : 0;

    return { monthlyData, yearlyData, dailyData, goalsData, categoryData };
  }, [data.historico, data.meta]);

  const totalBalance = useMemo(() => {
    return data.historico.reduce((acc, r) => {
      return r.tipo === 'entrada' ? acc + r.valor : acc - r.valor;
    }, 0);
  }, [data.historico]);

  const [isSyncing, setIsSyncing] = useState(false);

  const metaProgress = useMemo(() => {
    if (data.meta <= 0) return 0;
    return Math.min(100, (totalBalance / data.meta) * 100);
  }, [totalBalance, data.meta]);

  const taskProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const servicesToday = data.historico.filter(r => 
      r.data.startsWith(today) && r.tipo === 'entrada' && r.categoria === 'servico'
    ).length;
    const dailyGoal = 5; // Meta diária de 5 serviços
    return Math.min(100, (servicesToday / dailyGoal) * 100);
  }, [data.historico]);

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
    if (valor <= 0) {
      setErrorToast("O valor deve ser maior que zero.");
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1];
    const dateStr = selectedDate ? `${selectedDate}T${timeStr}` : now.toISOString();

    const newRecord: HistoryRecord = {
      id: generateId() as any,
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

  const addCatalogService = async () => {
    const newService = { id: generateId(), nome: 'Novo Serviço', valor: 0 };
    // Atualização do estado instantânea (Gatilho de re-renderização)
    setData(prev => ({ ...prev, servicos: [...prev.servicos, newService] }));
    
    try {
      // Simulação de API
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.05) reject(new Error('API Error')); // 5% chance de falha
          else resolve(true);
        }, 300);
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (error) {
      // Rollback em caso de falha
      setData(prev => ({ ...prev, servicos: prev.servicos.slice(0, -1) }));
      console.error('Erro ao adicionar serviço:', error);
    }
  };

  const deleteCatalogService = async (index: number) => {
    const serviceToDelete = data.servicos[index];
    // Atualização do estado instantânea (Gatilho de re-renderização)
    setData(prev => ({ ...prev, servicos: prev.servicos.filter((_, i) => i !== index) }));
    
    try {
      // Simulação de API
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.05) reject(new Error('API Error')); // 5% chance de falha
          else resolve(true);
        }, 300);
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (error) {
      // Rollback em caso de falha
      setData(prev => {
        const newServicos = [...prev.servicos];
        newServicos.splice(index, 0, serviceToDelete);
        return { ...prev, servicos: newServicos };
      });
      console.error('Erro ao excluir serviço:', error);
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

  const updateRecord = (updatedRecord: HistoryRecord) => {
    const oldRecord = data.historico.find(r => r.id === updatedRecord.id);
    if (!oldRecord) return;

    setData(prev => {
      // Revert old record impact on balance
      let newSaldo = oldRecord.tipo === 'entrada' ? prev.saldo - oldRecord.valor : prev.saldo + oldRecord.valor;
      // Apply new record impact on balance
      newSaldo = updatedRecord.tipo === 'entrada' ? newSaldo + updatedRecord.valor : newSaldo - updatedRecord.valor;

      return {
        ...prev,
        saldo: newSaldo,
        historico: prev.historico.map(r => r.id === updatedRecord.id ? updatedRecord : r)
      };
    });
    setEditingRecord(null);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      {isServiceModalOpen && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={(newService) => {
            setData(prev => ({
              ...prev,
              servicos: [...prev.servicos, newService],
              historico: [...prev.historico, {
                id: Date.now() + Math.random(),
                data: selectedDate ? `${selectedDate}T12:00:00Z` : new Date().toISOString(),
                tipo: 'entrada',
                descricao: newService.nome,
                valor: newService.valor,
                categoria: 'serviço'
              }]
            }));
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 2000);
          }}
        />
      )}
      {/* Elementos Atmosféricos de Fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[45%] bg-[#8b5cf6]/8 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] bg-cyan-400/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-2 pb-20 space-y-2 relative z-10">
        
        {/* Header Unificado */}
        <header className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setMainTab('inicio')}
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
              <h1 className="text-base font-black tracking-tight leading-tight text-slate-900">{data.barberName || "Flow Barber"}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Studio</p>
            </div>
          </button>
        </header>




        <AnimatePresence mode="wait">
          {mainTab === 'inicio' && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Saldo Principal - Reduzido */}
              <Card className="bg-white border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[24px] p-3 text-slate-900 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] mb-2">Saldo Disponível</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-200">€</span>
                    <h3 className="text-5xl font-black tracking-tighter text-slate-900 leading-none select-none">
                      {Math.floor(totalBalance)}
                      <span className="text-xl opacity-40">,{(totalBalance % 1).toFixed(2).split('.')[1]}</span>
                    </h3>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-6 -translate-y-1/2 opacity-[0.1] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <Scissors size={140} strokeWidth={1} className="text-emerald-500" />
                </div>
              </Card>

              {/* Seletor de Serviços/Produtos - Grid Colmeia (Movido para o topo) */}
              <Card className="bg-slate-100/30 border-none rounded-[24px] p-4 overflow-hidden">
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
                    key={`${activeTab}-${data.servicos.length}-${data.produtos.length}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-3 gap-2"
                  >
                    {(activeTab === 'servicos' ? data.servicos : data.produtos).map((item, i) => (
                      <motion.button
                        key={`${activeTab}-${item.id}`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.9, rotate: -1 }}
                        onClick={() => {
                          const itemId = `${item.nome}-${i}`;
                          setAddedItemId(itemId);
                          setTimeout(() => setAddedItemId(null), 1000);
                          // Adição Direta sem Popup de Confirmação
                          addRecord(
                            item.valor, 
                            item.nome, 
                            { nome: 'Cliente Avulso', tel: '' }, 
                            undefined, 
                            activeTab === 'servicos' ? 'servico' : 'produto'
                          );
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-[20px] shadow-sm border transition-all aspect-square text-center group relative overflow-hidden ${
                          addedItemId === `${item.nome}-${i}`
                            ? 'bg-emerald-500 border-emerald-400 text-white scale-105'
                            : activeTab === 'servicos' 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/20 text-white' 
                              : 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400/20 text-white'
                        }`}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-1.5 bg-white/20 rounded-lg mb-1">
                          {activeTab === 'servicos' ? <Scissors size={14} /> : <Package size={14} />}
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-tighter line-clamp-1 opacity-90">{item.nome}</span>
                        <span className="text-[10px] font-black mt-0.5">€{Math.floor(item.valor)}</span>
                      </motion.button>
                    ))}
                  </motion.div>

                  {/* Botão Minha Meta - Agora abaixo da janela de serviços */}
                  {isLoggedIn && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPerformancePanel(true)}
                      className="w-full mt-2 p-4 apple-glass flex items-center justify-between group border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                          <Target size={18} />
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Minha Meta</span>
                          <span className="block text-xs font-black text-slate-900">Ver Desempenho</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-500">{metaProgress.toFixed(0)}%</span>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </Card>

              {/* Nova Secção de Métricas */}
              <div className="space-y-2">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Métricas e Tendência</p>
                <MetricsSection 
                  ganhosHoje={dailyStats.comissao}
                  metaDiaria={data.meta / 30}
                  metaGeral={data.meta}
                  resumoMes={monthlyStats.comissao}
                />
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[100px]">
                    {loadingAI ? (
                      [1, 2, 3].map(i => (
                        <div key={`ai-skeleton-${i}`} className="space-y-3 animate-pulse">
                          <div className="h-4 w-24 bg-slate-200 rounded-full" />
                          <div className="h-3 w-full bg-slate-100 rounded-full" />
                        </div>
                      ))
                    ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                        <div key={`insight-${insight.title}-${i}`} className="space-y-2">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{insight.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 flex flex-col items-center justify-center gap-2 text-center">
                        <p className="text-xs text-slate-400 italic">Nenhum insight disponível no momento.</p>
                        <button 
                          onClick={() => {
                            setLoadingAI(true);
                            getAIInsights({
                              saldo: data.saldo,
                              meta: data.meta,
                              faturamento: monthlyStats.faturamento,
                              comissao: monthlyStats.comissao,
                              servicosCount: data.servicos.length,
                              produtosCount: data.produtos.length
                            }).then(res => {
                              if (res.insights) setAiInsights(res.insights);
                              setLoadingAI(false);
                            });
                          }}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                        >
                          Tentar novamente
                        </button>
                      </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[100px]">
                    {loadingTrends ? (
                      [1, 2, 3].map(i => (
                        <div key={`trend-skeleton-${i}`} className="space-y-3 animate-pulse">
                          <div className="h-4 w-24 bg-slate-200 rounded-full" />
                          <div className="h-3 w-full bg-slate-100 rounded-full" />
                        </div>
                      ))
                    ) : marketTrends.length > 0 ? (
                      marketTrends.map((trend, i) => (
                        <div key={`trend-${trend.title}-${i}`} className="space-y-2">
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
                      <div className="col-span-3 flex flex-col items-center justify-center gap-2 text-center">
                        <p className="text-xs text-slate-400 italic">Nenhuma tendência disponível no momento.</p>
                        <button 
                          onClick={() => {
                            setLoadingTrends(true);
                            getMarketTrends().then(res => {
                              if (res.trends) setMarketTrends(res.trends);
                              setLoadingTrends(false);
                            });
                          }}
                          className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:underline"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* FAB */}
          <button
            onClick={() => setShowMetricsDrawer(true)}
            className="fixed bottom-6 right-6 p-4 bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-lg z-50 text-slate-900"
          >
            <ChartColumn size={24} />
          </button>

          <MetricsDrawer 
            isOpen={showMetricsDrawer} 
            onClose={() => setShowMetricsDrawer(false)}
            metrics={{
              ganhosHoje: dailyStats.faturamento,
              metaDiaria: data.meta / 30,
              metaGeral: data.meta,
              resumoMes: monthlyStats.faturamento
            }}
          />

          {mainTab === 'agenda' && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <CalendarGrid 
                data={data} 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
                onShowFolgas={() => { setShowSettingsPopup(true); setSettingsTab('folgas'); }}
                onSetFolgaEspecifica={(date, periodo) => {
                  setData(prev => {
                    const newFolgas = { ...prev.folgasEspecificas };
                    if (periodo) {
                      newFolgas[date] = periodo;
                    } else {
                      delete newFolgas[date];
                    }
                    return { ...prev, folgasEspecificas: newFolgas };
                  });
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 2000);
                }}
                onAddService={() => setIsServiceModalOpen(true)}
                onClearMonth={(month, year) => {
                  setData(prev => ({
                    ...prev,
                    historico: prev.historico.filter(r => {
                      const date = new Date(r.data);
                      return !(date.getMonth() === month && date.getFullYear() === year);
                    })
                  }));
                }}
                onClearDay={(date) => {
                  setData(prev => ({
                    ...prev,
                    historico: prev.historico.filter(r => r.data.split('T')[0] !== date)
                  }));
                }}
              />
            </motion.div>
          )}

          {mainTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <ChartColumn size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento por Categoria</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Serviços', value: chartData.categoryData.totalServicos },
                            { name: 'Produtos', value: chartData.categoryData.totalProdutos }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell key="cell-servicos" fill="#10b981" />
                          <Cell key="cell-produtos" fill="#6366f1" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 content-center">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Serviços</p>
                      <h4 className="text-xl font-black text-slate-900">{formatCurrency(chartData.categoryData.totalServicos)}</h4>
                      <p className="text-emerald-500 font-black text-[10px]">{chartData.categoryData.percentServicos.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Produtos</p>
                      <h4 className="text-xl font-black text-slate-900">{formatCurrency(chartData.categoryData.totalProdutos)}</h4>
                      <p className="text-indigo-500 font-black text-[10px]">{chartData.categoryData.percentProdutos.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <ChartColumn size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento por Dia (Mês Atual)</h3>
                </div>
                <div className="h-48 w-full">
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
                        tickFormatter={(value) => `€${value}`}
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
                <div className="h-48 w-full">
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
                        tickFormatter={(value) => `€${value}`}
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
                <div className="h-48 w-full">
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
                        tickFormatter={(value) => `€${value}`}
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
                <div className="h-48 w-full">
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
                        tickFormatter={(value) => `€${value}`}
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
                <div className="flex items-center justify-between mb-6">
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
                          {data.historico.filter(r => r.tipo === 'entrada' && r.categoria === 'servico').length} Serviços
                        </span>
                        <span className="text-[8px] font-black text-cyan-500 uppercase bg-cyan-50 px-1.5 py-0.5 rounded-md">
                          {data.historico.filter(r => r.tipo === 'entrada' && r.categoria === 'produto').length} Produtos
                        </span>
                      </div>
                    </div>
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

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {data.historico
                      .filter(r => !selectedDate || r.data.split('T')[0] === selectedDate)
                      .slice(0, visibleRecords)
                      .map((r, i) => (
                        <motion.div
                          key={`${r.id}-${i}`}
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
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => setEditingRecord(r)}
                                className="p-2 text-slate-300 hover:text-indigo-500 transition-all bg-white rounded-xl shadow-sm"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => deleteRecord(r.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-all bg-white rounded-xl shadow-sm"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

      {/* Mini FAB para Metas */}
      {isLoggedIn && mainTab === 'inicio' && (
        <button
          onClick={() => setShowPerformancePanel(true)}
          className="fixed bottom-24 right-6 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-105 transition-all z-40"
          aria-label="Ver Metas e Performance"
        >
          <Target size={20} />
        </button>
      )}

      {/* Bottom Navigation Integrada */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 z-50 w-[90%] max-w-md">
        <div className="flex items-center justify-between">
          <NavButton 
            active={mainTab === 'inicio'} 
            onClick={() => setMainTab('inicio')} 
            icon={<LayoutGrid size={22} />} 
            label="Início" 
          />
          <NavButton 
            active={mainTab === 'agenda'} 
            onClick={() => setMainTab('agenda')} 
            icon={<Calendar size={22} />} 
            label="Agenda" 
          />
          <NavButton 
            active={mainTab === 'analytics'} 
            onClick={() => setMainTab('analytics')} 
            icon={<ChartColumn size={22} />} 
            label="Analytics" 
          />
          <NavButton 
            active={mainTab === 'historico'} 
            onClick={() => setMainTab('historico')} 
            icon={<Clock size={22} />} 
            label="Histórico" 
          />
          <NavButton 
            active={mainTab === 'config'} 
            onClick={() => setShowSettingsPopup(true)} 
            icon={<Settings size={22} />} 
            label="Config" 
          />
        </div>
      </nav>

      {/* Popups */}
      <AnimatePresence>
        {showSettingsPopup && (
          <Popup key="popup-settings" title="Configurações" onClose={() => setShowSettingsPopup(false)}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto custom-scrollbar">
                <button 
                  onClick={() => setSettingsTab('perfil')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${settingsTab === 'perfil' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Perfil
                </button>
                <button 
                  onClick={() => setSettingsTab('catalogo')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${settingsTab === 'catalogo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Catálogo
                </button>
                <button 
                  onClick={() => setSettingsTab('metas')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${settingsTab === 'metas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Metas
                </button>
                <button 
                  onClick={() => setSettingsTab('folgas')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${settingsTab === 'folgas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Folgas
                </button>
              </div>

              {settingsTab === 'metas' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Valor da Meta (€)</label>
                      <input 
                        type="number" 
                        defaultValue={data.meta}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (val < 0) {
                            setErrorToast("A meta não pode ser negativa.");
                            setTimeout(() => setErrorToast(null), 3000);
                            e.target.value = data.meta.toString();
                            return;
                          }
                          setData(prev => ({ ...prev, meta: val }));
                        }}
                        className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-black text-2xl text-slate-900 text-center"
                      />
                  </div>
                  <button onClick={() => setShowSettingsPopup(false)} className="btn-primary w-full py-5 rounded-[32px] uppercase tracking-widest text-xs font-black">Salvar Meta</button>
                </div>
              )}

              {settingsTab === 'perfil' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="border-b border-slate-50 pb-4 flex flex-col gap-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil & Configurações</p>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      {isEditingName ? (
                        <>
                          <input 
                            type="text" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-black text-slate-900 outline-none px-2"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setData(prev => ({ ...prev, barberName: tempName }));
                                setIsEditingName(false);
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              setData(prev => ({ ...prev, barberName: tempName }));
                              setIsEditingName(false);
                            }}
                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-black text-slate-900 px-2 truncate">{data.barberName || "Flow Barber"}</span>
                          <button 
                            onClick={() => {
                              setTempName(data.barberName || "Flow Barber");
                              setIsEditingName(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                          >
                            <Pencil size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Comissão sliders removed as requested */}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => {
                        setShowReportModal(true);
                        setShowSettingsPopup(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all text-indigo-600 font-bold text-sm border border-indigo-100"
                    >
                      <div className="p-2 bg-indigo-500 text-white rounded-xl"><ChartColumn size={16} /></div>
                      Análise de Faturação e Relatórios
                    </button>
                    <button 
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-600 font-bold text-sm"
                    >
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Users size={16} /></div>
                      Alterar Foto
                    </button>
                    <button 
                      onClick={() => {
                        // Handle logout
                        setShowSettingsPopup(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-2xl transition-all text-red-600 font-bold text-sm"
                    >
                      <div className="p-2 bg-red-100 rounded-xl text-red-400"><X size={16} /></div>
                      Sair
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'folgas' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
                  <button onClick={() => setShowSettingsPopup(false)} className="btn-primary w-full py-5 rounded-[32px]">Salvar Configurações</button>
                </div>
              )}

              {settingsTab === 'catalogo' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  {/* Comissões */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-[32px] space-y-4 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comissão Serviços</h4>
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
                    <div className="p-5 bg-white rounded-[32px] space-y-4 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comissão Produtos</h4>
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

                  {/* Listas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Serviços */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Serviços</h4>
                        <span className="text-[10px] font-black text-slate-400">{data.servicos.length} itens</span>
                      </div>
                      <div className="space-y-2">
                        {data.servicos.map((s, i) => (
                          <div key={s.id} className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 transition-all">
                            <input 
                              type="text" 
                              value={s.nome}
                              onChange={(e) => {
                                const newServicos = [...data.servicos];
                                newServicos[i].nome = e.target.value;
                                setData(prev => ({ ...prev, servicos: newServicos }));
                              }}
                              className="flex-1 p-1 rounded-lg bg-transparent font-black text-xs text-slate-900 outline-none"
                            />
                            <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 mr-0.5">€</span>
                              <input 
                                type="number" 
                                value={s.valor}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (val < 0) return;
                                  setData(prev => {
                                    const newServicos = [...prev.servicos];
                                    newServicos[i] = { ...newServicos[i], valor: val };
                                    return { ...prev, servicos: newServicos };
                                  });
                                }}
                                className="w-12 p-1 bg-transparent font-black text-xs text-emerald-500 outline-none text-right"
                              />
                            </div>
                            <button 
                              onClick={() => deleteCatalogService(i)}
                              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={addCatalogService}
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] hover:border-emerald-500/30 hover:text-emerald-500 transition-all uppercase tracking-widest"
                      >
                        <Plus size={16} /> Adicionar Serviço
                      </button>
                    </div>

                    {/* Produtos */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Produtos</h4>
                        <span className="text-[10px] font-black text-slate-400">{data.produtos.length} itens</span>
                      </div>
                      <div className="space-y-2">
                        {data.produtos.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-cyan-500/30 transition-all">
                            <input 
                              type="text" 
                              value={p.nome}
                              onChange={(e) => {
                                const newProdutos = [...data.produtos];
                                newProdutos[i].nome = e.target.value;
                                setData(prev => ({ ...prev, produtos: newProdutos }));
                              }}
                              className="flex-1 p-1 rounded-lg bg-transparent font-black text-xs text-slate-900 outline-none"
                            />
                            <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 mr-0.5">€</span>
                              <input 
                                type="number" 
                                value={p.valor}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (val < 0) return;
                                  const newProdutos = [...data.produtos];
                                  newProdutos[i].valor = val;
                                  setData(prev => ({ ...prev, produtos: newProdutos }));
                                }}
                                className="w-12 p-1 bg-transparent font-black text-xs text-cyan-500 outline-none text-right"
                              />
                            </div>
                            <button 
                              onClick={() => setData(prev => ({ ...prev, produtos: prev.produtos.filter((_, idx) => idx !== i) }))}
                              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setData(prev => ({ ...prev, produtos: [...prev.produtos, { nome: 'Novo Produto', valor: 0 }] }))}
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] hover:border-cyan-500/30 hover:text-cyan-500 transition-all uppercase tracking-widest"
                      >
                        <Plus size={16} /> Adicionar Produto
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Exportar Dados</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => exportToCSV(data.historico, 'historico.csv', true)}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Histórico (CSV)
                      </button>
                      <button 
                        onClick={() => exportToCSV([...data.servicos.map(s => ({...s, tipo: 'servico'})), ...data.produtos.map(p => ({...p, tipo: 'produto'}))], 'catalogo.csv')}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Catálogo (CSV)
                      </button>
                      <button 
                        onClick={() => {
                          setShowSettingsPopup(false);
                          setShowReportModal(true);
                        }}
                        className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all col-span-2"
                      >
                        Baixar Relatório (PDF)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}

        {showClientPopup && pendingService && (
          <Popup key="popup-client" title="Confirmar Registro" onClose={() => {
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
                      .map((c, i) => (
                        <button
                          key={`${c.id}-${i}`}
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
                          id: generateId() as any,
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

        {editingRecord && (
          <Popup key="popup-edit-record" title="Editar Registro" onClose={() => setEditingRecord(null)}>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Descrição</label>
                <input 
                  type="text" 
                  value={editingRecord.descricao}
                  onChange={(e) => setEditingRecord({...editingRecord, descricao: e.target.value})}
                  className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-slate-900"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Valor (€)</label>
                <input 
                  type="number" 
                  value={editingRecord.valor}
                  onChange={(e) => setEditingRecord({...editingRecord, valor: Number(e.target.value)})}
                  className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-slate-900"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Data</label>
                <input 
                  type="datetime-local" 
                  value={new Date(new Date(editingRecord.data).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingRecord({...editingRecord, data: new Date(e.target.value).toISOString()})}
                  className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-slate-900"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Categoria</label>
                <select 
                  value={editingRecord.categoria || ''}
                  onChange={(e) => setEditingRecord({...editingRecord, categoria: e.target.value as 'servico' | 'produto'})}
                  className="w-full p-5 rounded-[32px] bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-slate-900"
                >
                  <option value="servico">Serviço</option>
                  <option value="produto">Produto</option>
                </select>
              </div>
              <button 
                onClick={() => updateRecord(editingRecord)}
                className="btn-primary w-full py-5 rounded-[32px] uppercase tracking-widest text-xs font-black"
              >
                Salvar Alterações
              </button>
            </div>
          </Popup>
        )}
      </AnimatePresence>

      {/* Botão Flutuante Removido (Agora está abaixo da janela de serviços) */}

      {/* Performance Panel Overlay */}
      <AnimatePresence>
        {showPerformancePanel && (
          <motion.div
            key="performance-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center p-6 bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-8 space-y-8 relative"
            >
              <button 
                onClick={() => setShowPerformancePanel(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Painel de Performance</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Métricas em tempo real</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Ganhos do Dia */}
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ganhos do Dia</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-300">€</span>
                    <h4 className="text-4xl font-black text-slate-900">{dailyStats.comissao.toFixed(2)}</h4>
                  </div>
                </div>

                {/* Meta Diária */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta Diária</p>
                      <h4 className="text-2xl font-black text-slate-900">{taskProgress.toFixed(0)}%</h4>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Objetivo: 5 serviços</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${taskProgress}%` }}
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    />
                  </div>
                </div>

                {/* Meta Geral */}
                <div className="space-y-4 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta Geral (Mensal)</p>
                      <h4 className="text-2xl font-black text-slate-900">{metaProgress.toFixed(0)}%</h4>
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Objetivo: €{data.meta}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metaProgress}%` }}
                      className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowPerformancePanel(false)}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-[32px] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
              >
                Fechar Painel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        data={data} 
      />

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
            <motion.div
              key="success-toast"
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
          {errorToast && (
            <motion.div
              key="error-toast"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-8 py-5 rounded-[32px] shadow-[0_20px_40px_rgba(239,68,68,0.4)] flex items-center gap-4 border-2 border-red-400/30"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                className="bg-white text-red-500 p-2 rounded-full shadow-inner"
              >
                <AlertCircle size={24} strokeWidth={3} />
              </motion.div>
              <span className="font-black text-base uppercase tracking-widest">{errorToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Adjustment Popup */}
        <AnimatePresence>
          {showPhotoAdjustment && (
            <Popup key="popup-photo-adjust" title="Ajustar Foto" onClose={() => setShowPhotoAdjustment(false)}>
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
    aria-label={label}
    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all relative group ${
      active ? 'bg-slate-900 text-white shadow-md scale-110' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
    } active:scale-95`}
  >
    {icon}
  </button>
);

const CalendarGrid = ({ data, selectedDate, onSelectDate, onShowFolgas, onClearMonth, onClearDay, onSetFolgaEspecifica, onAddService }: { data: AppData, selectedDate: string | null, onSelectDate: (d: string | null) => void, onShowFolgas: () => void, onClearMonth: (month: number, year: number) => void, onClearDay: (date: string) => void, onSetFolgaEspecifica: (date: string, periodo: 'completo' | 'manha' | 'tarde' | null) => void, onAddService: () => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isMarkingFolga, setIsMarkingFolga] = useState(false);
  const [folgaPopupDate, setFolgaPopupDate] = useState<string | null>(null);
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
      const dateKey = getLocalISO(date);
      
      const hasRecords = records.some(r => r.data.split('T')[0] === dateKey);
      if (hasRecords) continue;

      const folgaEspecifica = data.folgasEspecificas?.[dateKey];
      const folgaRecorrente = data.diasFolga.find(df => df.dia === date.getDay());
      
      const isFolga = folgaEspecifica ? (folgaEspecifica !== null) : !!folgaRecorrente;
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

            return (
              <div key={day} className="relative">
                <button
                  onClick={() => {
                    if (isMarkingFolga) {
                      setFolgaPopupDate(dateKey);
                    } else if (folga) {
                      onSelectDate(isSelected ? null : dateKey);
                    } else {
                      onSelectDate(dateKey);
                      onAddService();
                    }
                  }}
                  className={`
                    w-full relative flex flex-col items-center justify-center rounded-xl transition-all h-12 border
                    ${isSelected && !isMarkingFolga ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_8px_20px_rgba(16,185,129,0.1)]' : 
                      isToday ? 'border-indigo-500/50 bg-indigo-500/5' : 
                      folga ? 'border-amber-200 bg-amber-50/50' :
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
                  </div>

                  {folga && (
                    <div className="absolute bottom-1.5 text-amber-500 opacity-40">
                      <Coffee size={10} />
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

      {/* Selected Day Details */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            key={`details-${selectedDate}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">
                Agenda: {selectedDate.split('-').reverse().join('/')}
              </h3>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] font-black text-emerald-500">
                    {formatCurrency(dailyData[selectedDate]?.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {data.historico
                .filter(r => r.data.split('T')[0] === selectedDate)
                .map((r, i) => (
                  <div key={`historico-popup-${r.id}-${i}`} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${r.categoria === 'produto' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        {r.categoria === 'produto' ? <DollarSign size={12} /> : <Scissors size={12} />}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-black text-slate-900 leading-tight">{r.descricao}</p>
                        <p className="text-[9px] font-bold text-slate-400">
                          {r.clienteNome || 'Cliente não identificado'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-black text-emerald-500`}>
                      {formatCurrency(r.valor)}
                    </span>
                  </div>
                ))}
              
              {(!dailyData[selectedDate] || dailyData[selectedDate].count === 0) && (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400">Nenhum agendamento para este dia.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Popup = React.forwardRef<HTMLDivElement, { title: string, children: React.ReactNode, onClose: () => void }>(({ title, children, onClose }, ref) => (
  <motion.div
    ref={ref}
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
));
Popup.displayName = 'Popup';

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
