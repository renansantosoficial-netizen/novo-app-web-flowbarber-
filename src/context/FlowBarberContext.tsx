import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, Product, Expense } from '../types';
import { getAIInsights, getMarketTrends } from '../services/geminiService';

interface FlowBarberContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  generateId: () => string;
  formatCurrency: (value: number) => string;
  getLocalISO: (date: Date) => string;
  
  // State
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDarkMode: () => void;
  mainTab: 'inicio' | 'agenda' | 'analytics' | 'historico' | 'config';
  setMainTab: React.Dispatch<React.SetStateAction<'inicio' | 'agenda' | 'analytics' | 'historico' | 'config'>>;
  
  // UI State
  showSuccessToast: boolean;
  setShowSuccessToast: React.Dispatch<React.SetStateAction<boolean>>;
  errorToast: string | null;
  setErrorToast: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Additional UI State from App.tsx
  activeTab: 'servicos' | 'produtos';
  setActiveTab: React.Dispatch<React.SetStateAction<'servicos' | 'produtos'>>;
  selectedDate: string | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<string | null>>;
  historyDateRange: { start: string | null, end: string | null };
  setHistoryDateRange: React.Dispatch<React.SetStateAction<{ start: string | null, end: string | null }>>;
  historySearch: string;
  setHistorySearch: React.Dispatch<React.SetStateAction<string>>;
  historyClientFilter: string;
  setHistoryClientFilter: React.Dispatch<React.SetStateAction<string>>;
  historyTypeFilter: 'todos' | 'servico' | 'produto';
  setHistoryTypeFilter: React.Dispatch<React.SetStateAction<'todos' | 'servico' | 'produto'>>;
  showMetricsDrawer: boolean;
  setShowMetricsDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  showReportModal: boolean;
  setShowReportModal: React.Dispatch<React.SetStateAction<boolean>>;
  showPerformancePanel: boolean;
  setShowPerformancePanel: React.Dispatch<React.SetStateAction<boolean>>;
  showSettingsPopup: boolean;
  setShowSettingsPopup: React.Dispatch<React.SetStateAction<boolean>>;
  isCatalogSelectionModalOpen: boolean;
  setIsCatalogSelectionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settingsTab: 'catalogo' | 'metas' | 'folgas' | 'perfil';
  setSettingsTab: React.Dispatch<React.SetStateAction<'catalogo' | 'metas' | 'folgas' | 'perfil'>>;
  showClientPopup: boolean;
  setShowClientPopup: React.Dispatch<React.SetStateAction<boolean>>;
  clientSearch: string;
  setClientSearch: React.Dispatch<React.SetStateAction<string>>;
  pendingService: { nome: string, valor: number, categoria: 'servico' | 'produto' } | null;
  setPendingService: React.Dispatch<React.SetStateAction<{ nome: string, valor: number, categoria: 'servico' | 'produto' } | null>>;
  addedItemId: string | null;
  setAddedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  editingRecord: HistoryRecord | null;
  setEditingRecord: React.Dispatch<React.SetStateAction<HistoryRecord | null>>;
  showPhotoAdjustment: string | null;
  setShowPhotoAdjustment: React.Dispatch<React.SetStateAction<string | null>>;
  crop: { x: number, y: number };
  setCrop: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  croppedAreaPixels: any;
  setCroppedAreaPixels: React.Dispatch<React.SetStateAction<any>>;
  newClient: { nome: string, tel: string };
  setNewClient: React.Dispatch<React.SetStateAction<{ nome: string, tel: string }>>;
  visibleRecords: number;
  setVisibleRecords: React.Dispatch<React.SetStateAction<number>>;
  selectedRecurrence: number;
  setSelectedRecurrence: React.Dispatch<React.SetStateAction<number>>;
  aiInsights: { title: string, description: string }[];
  setAiInsights: React.Dispatch<React.SetStateAction<{ title: string, description: string }[]>>;
  strategicPrompt: string;
  setStrategicPrompt: React.Dispatch<React.SetStateAction<string>>;
  marketTrends: { title: string, description: string, url?: string }[];
  setMarketTrends: React.Dispatch<React.SetStateAction<{ title: string, description: string, url?: string }[]>>;
  loadingAI: boolean;
  setLoadingAI: React.Dispatch<React.SetStateAction<boolean>>;
  loadingTrends: boolean;
  setLoadingTrends: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Calculations
  totalBalance: number;
  totalCommissions: { servicos: number; produtos: number };
  monthlyStats: { faturamento: number; comissao: number };
  dailyStats: { faturamento: number; comissao: number };
  metaProgress: number;
  taskProgress: number;
  upcomingReturns: any[];
  chartData: any;
  filteredHistorico: HistoryRecord[];
  historicoStats: { servicos: number; produtos: number };
  
  // Actions
  addRecord: (valor: number, descricao: string, cliente?: { nome: string, tel: string }, recorrencia?: number, categoria?: 'servico' | 'produto') => void;
  deleteRecord: (id: string) => void;
  updateRecord: (updatedRecord: HistoryRecord) => void;
  revertRecord: (recordId: string, historyIndex: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addCatalogService: (service: Omit<Service, 'id'>) => void;
  deleteCatalogService: (id: string) => void;
  addCatalogProduct: (product: Omit<Product, 'id'>) => void;
  deleteCatalogProduct: (id: string) => void;
  openConfirmation: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'warning' | 'info') => void;
}

const FlowBarberContext = createContext<FlowBarberContextType | undefined>(undefined);

export const useFlowBarber = () => {
  const context = useContext(FlowBarberContext);
  if (!context) {
    throw new Error('useFlowBarber must be used within a FlowBarberProvider');
  }
  return context;
};

export const FlowBarberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('flowBarberData');
    if (!saved) return DEFAULT_DATA;
    try {
      const parsed = JSON.parse(saved);
      
      const usedIds = new Set<string>();
      
      const ensureUniqueId = (id: string | undefined) => {
        let newId = id || generateId();
        while (usedIds.has(newId)) {
          newId = generateId();
        }
        usedIds.add(newId);
        return newId;
      };

      const historico = (parsed.historico || DEFAULT_DATA.historico).map((r: any) => ({
        ...r,
        id: ensureUniqueId(r.id)
      }));

      const contatos = (parsed.contatos || DEFAULT_DATA.contatos).map((c: any) => ({
        ...c,
        id: ensureUniqueId(c.id)
      }));

      const servicos = (parsed.servicos || DEFAULT_DATA.servicos).map((s: any) => ({
        ...s,
        id: ensureUniqueId(s.id)
      }));

      const produtos = (parsed.produtos || DEFAULT_DATA.produtos).map((p: any) => ({
        ...p,
        id: ensureUniqueId(p.id)
      }));

      const despesas = (parsed.despesas || DEFAULT_DATA.despesas || []).map((e: any) => ({
        ...e,
        id: ensureUniqueId(e.id)
      }));

      return {
        ...DEFAULT_DATA,
        ...parsed,
        historico,
        contatos,
        servicos,
        produtos,
        despesas,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('flowBarberData', JSON.stringify(data));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, -1);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('flowBarberLoggedIn') === '1');
  const [darkMode, setDarkMode] = useState(true);
  const [mainTab, setMainTab] = useState<'inicio' | 'agenda' | 'analytics' | 'historico' | 'config'>('inicio');
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const successToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'servicos' | 'produtos'>('servicos');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
  const [historySearch, setHistorySearch] = useState('');
  const [historyClientFilter, setHistoryClientFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'todos' | 'servico' | 'produto'>('todos');
  const [showMetricsDrawer, setShowMetricsDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [isCatalogSelectionModalOpen, setIsCatalogSelectionModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'catalogo' | 'metas' | 'folgas' | 'perfil'>('catalogo');
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [pendingService, setPendingService] = useState<{ nome: string, valor: number, categoria: 'servico' | 'produto' } | null>(null);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<HistoryRecord | null>(null);
  const [showPhotoAdjustment, setShowPhotoAdjustment] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [newClient, setNewClient] = useState({ nome: '', tel: '' });
  const [visibleRecords, setVisibleRecords] = useState(10);
  const [selectedRecurrence, setSelectedRecurrence] = useState<number>(0);
  const [aiInsights, setAiInsights] = useState<{ title: string, description: string }[]>([]);
  const [strategicPrompt, setStrategicPrompt] = useState<string>("");
  const [marketTrends, setMarketTrends] = useState<{ title: string, description: string, url?: string }[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const openConfirmation = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const triggerSuccessToast = () => {
    if (successToastTimeoutRef.current) clearTimeout(successToastTimeoutRef.current);
    setShowSuccessToast(true);
    successToastTimeoutRef.current = setTimeout(() => setShowSuccessToast(false), 3000);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryList | MediaQueryListEvent) => {
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

  const filteredHistorico = useMemo(() => {
    return data.historico.filter(r => {
      const rDate = r.data.split('T')[0];
      if (historyDateRange.start && rDate < historyDateRange.start) return false;
      if (historyDateRange.end && rDate > historyDateRange.end) return false;
      if (!historyDateRange.start && !historyDateRange.end && selectedDate && rDate !== selectedDate) return false;
      
      if (historySearch && !r.descricao.toLowerCase().includes(historySearch.toLowerCase())) return false;
      if (historyClientFilter && (!r.clienteNome || !r.clienteNome.toLowerCase().includes(historyClientFilter.toLowerCase()))) return false;
      if (historyTypeFilter !== 'todos' && r.categoria !== historyTypeFilter) return false;
      
      return true;
    });
  }, [data.historico, historyDateRange, selectedDate, historySearch, historyClientFilter, historyTypeFilter]);

  const historicoStats = useMemo(() => {
    let servicos = 0;
    let produtos = 0;
    data.historico.forEach(r => {
      if (r.tipo === 'entrada') {
        if (r.categoria === 'servico' || !r.categoria) servicos++;
        if (r.categoria === 'produto') produtos++;
      }
    });
    return { servicos, produtos };
  }, [data.historico]);

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

  const totalBalance = useMemo(() => {
    const revenue = data.historico.reduce((acc, r) => {
      return r.tipo === 'entrada' ? acc + r.valor : acc - r.valor;
    }, 0);
    const expenses = data.despesas.reduce((acc, e) => acc + e.valor, 0);
    return revenue - expenses;
  }, [data.historico, data.despesas]);

  const totalCommissions = useMemo(() => {
    return data.historico.reduce((acc, r) => {
      if (r.tipo === 'entrada') {
        if (r.categoria === 'servico') {
          acc.servicos += r.valor * (data.percentualGanho / 100);
        } else if (r.categoria === 'produto') {
          acc.produtos += r.valor * (data.percentualProdutos / 100);
        }
      }
      return acc;
    }, { servicos: 0, produtos: 0 });
  }, [data.historico, data.percentualGanho, data.percentualProdutos]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const faturamento = data.historico
        .filter(r => {
          const datePart = r.data.split('T')[0];
          const [year, m] = datePart.split('-').map(Number);
          return (m - 1) === index && year === currentYear && r.tipo === 'entrada';
        })
        .reduce((acc, r) => acc + r.valor, 0);
      
      return { name: month, valor: faturamento };
    });

    const yearlyData = Array.from({ length: 5 }).map((_, i) => {
      const year = currentYear - (4 - i);
      const faturamento = data.historico
        .filter(r => {
          const y = Number(r.data.split('-')[0]);
          return y === currentYear - (4 - i) && r.tipo === 'entrada';
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
          const [year, m] = datePart.split('-').map(Number);
          return (m - 1) === index && year === currentYear && r.tipo === 'entrada';
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

  const metaProgress = useMemo(() => {
    if (data.meta <= 0) return 0;
    return Math.min(100, (totalBalance / data.meta) * 100);
  }, [totalBalance, data.meta]);

  const taskProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const servicesToday = data.historico.filter(r => 
      r.data.startsWith(today) && r.tipo === 'entrada' && r.categoria === 'servico'
    ).length;
    const dailyGoal = 5;
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
      id: generateId(),
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

    triggerSuccessToast();
  };

  const deleteRecord = (id: string) => {
    setData(prev => {
      const record = prev.historico.find(r => r.id === id);
      if (!record) return prev;

      return {
        ...prev,
        saldo: record.tipo === 'entrada' ? prev.saldo - record.valor : prev.saldo + record.valor,
        historico: prev.historico.filter(r => r.id !== id)
      };
    });
  };

  const updateRecord = (updatedRecord: HistoryRecord) => {
    setData(prev => {
      const oldRecord = prev.historico.find(r => r.id === updatedRecord.id);
      if (!oldRecord) return prev;

      const historyEntry = {
        timestamp: new Date().toISOString(),
        oldData: { ...oldRecord, editHistory: undefined }
      };
      
      const recordWithHistory = {
        ...updatedRecord,
        editHistory: [...(oldRecord.editHistory || []), historyEntry]
      };

      let newSaldo = oldRecord.tipo === 'entrada' ? prev.saldo - oldRecord.valor : prev.saldo + oldRecord.valor;
      newSaldo = updatedRecord.tipo === 'entrada' ? newSaldo + updatedRecord.valor : newSaldo - updatedRecord.valor;

      return {
        ...prev,
        saldo: newSaldo,
        historico: prev.historico.map(r => r.id === updatedRecord.id ? recordWithHistory : r)
      };
    });
    setEditingRecord(null);
  };

  const revertRecord = (recordId: string, historyIndex: number) => {
    setData(prev => {
      const record = prev.historico.find(r => r.id === recordId);
      if (!record || !record.editHistory || !record.editHistory[historyIndex]) return prev;

      const oldData = record.editHistory[historyIndex].oldData;
      
      let newSaldo = record.tipo === 'entrada' ? prev.saldo - record.valor : prev.saldo + record.valor;
      newSaldo = oldData.tipo === 'entrada' ? newSaldo + (oldData.valor || 0) : newSaldo - (oldData.valor || 0);

      const revertedRecord = {
        ...record,
        ...oldData,
        editHistory: record.editHistory.slice(0, historyIndex)
      };

      return {
        ...prev,
        saldo: newSaldo,
        historico: prev.historico.map(r => r.id === recordId ? revertedRecord : r)
      };
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId()
    };
    setData(prev => ({
      ...prev,
      despesas: [newExpense, ...prev.despesas]
    }));
    triggerSuccessToast();
  };

  const deleteExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      despesas: prev.despesas.filter(e => e.id !== id)
    }));
  };

  const addCatalogService = (service: Omit<Service, 'id'>) => {
    const newService: Service = { ...service, id: generateId() };
    setData(prev => ({
      ...prev,
      servicos: [...prev.servicos, newService]
    }));
    triggerSuccessToast();
  };

  const deleteCatalogService = (id: string) => {
    setData(prev => ({
      ...prev,
      servicos: prev.servicos.filter(s => s.id !== id)
    }));
  };

  const addCatalogProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: generateId() };
    setData(prev => ({
      ...prev,
      produtos: [...prev.produtos, newProduct]
    }));
    triggerSuccessToast();
  };

  const deleteCatalogProduct = (id: string) => {
    setData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(p => p.id !== id)
    }));
  };

  return (
    <FlowBarberContext.Provider value={{
      data, setData, generateId, formatCurrency, getLocalISO,
      isLoggedIn, setIsLoggedIn, darkMode, setDarkMode, toggleDarkMode,
      mainTab, setMainTab, showSuccessToast, setShowSuccessToast, errorToast, setErrorToast,
      activeTab, setActiveTab, selectedDate, setSelectedDate, historyDateRange, setHistoryDateRange,
      historySearch, setHistorySearch, historyClientFilter, setHistoryClientFilter, historyTypeFilter, setHistoryTypeFilter,
      showMetricsDrawer, setShowMetricsDrawer, showReportModal, setShowReportModal, showPerformancePanel, setShowPerformancePanel, showSettingsPopup, setShowSettingsPopup,
      isCatalogSelectionModalOpen, setIsCatalogSelectionModalOpen,
      settingsTab, setSettingsTab, showClientPopup, setShowClientPopup, clientSearch, setClientSearch,
      pendingService, setPendingService, addedItemId, setAddedItemId, editingRecord, setEditingRecord,
      showPhotoAdjustment, setShowPhotoAdjustment, crop, setCrop, zoom, setZoom, croppedAreaPixels, setCroppedAreaPixels,
      newClient, setNewClient, visibleRecords, setVisibleRecords, selectedRecurrence, setSelectedRecurrence,
      aiInsights, setAiInsights, strategicPrompt, setStrategicPrompt, marketTrends, setMarketTrends,
      loadingAI, setLoadingAI, loadingTrends, setLoadingTrends,
      totalBalance, totalCommissions, monthlyStats, dailyStats, metaProgress, taskProgress, upcomingReturns, chartData,
      filteredHistorico, historicoStats,
      addRecord, deleteRecord, updateRecord, revertRecord, addExpense, deleteExpense,
      addCatalogService, deleteCatalogService, addCatalogProduct, deleteCatalogProduct,
      openConfirmation
    }}>
      {children}
      
      {/* Global Modals/Toasts */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-2">{confirmation.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmation.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmation.onConfirm}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                  confirmation.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' :
                  confirmation.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </FlowBarberContext.Provider>
  );
};
