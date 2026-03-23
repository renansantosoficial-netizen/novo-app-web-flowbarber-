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
import { CatalogSelectionModal } from './components/CatalogSelectionModal';
import { Popup } from './components/Popup';
import { MetricsSection } from './components/MetricsSection';
import { MetricsDrawer } from './components/MetricsDrawer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ReportModal } from './components/ReportModal';
import { ServiceModal } from './components/ServiceModal';
import DashboardTab from './components/tabs/DashboardTab';
import AgendaTab from './components/tabs/AgendaTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import HistoricoTab from './components/tabs/HistoricoTab';
import ExpensesTab from './components/tabs/ExpensesTab';
import SettingsPopup from './components/popups/SettingsPopup';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, DayOffConfig, SpecialEvent, Expense } from './types';
import { getAIInsights, getMarketTrends } from './services/geminiService';
import Cropper from 'react-easy-crop';
import { useFlowBarber } from './context/FlowBarberContext';

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

export default function App() {
  const {
    data, setData, generateId, formatCurrency, getLocalISO,
    isLoggedIn, setIsLoggedIn, darkMode, setDarkMode, toggleDarkMode,
    mainTab, setMainTab, showSuccessToast, setShowSuccessToast, errorToast, setErrorToast,
    activeTab, setActiveTab, selectedDate, setSelectedDate, historyDateRange, setHistoryDateRange,
    showMetricsDrawer, setShowMetricsDrawer, showReportModal, setShowReportModal, showPerformancePanel, setShowPerformancePanel, showSettingsPopup, setShowSettingsPopup,
    isCatalogSelectionModalOpen, setIsCatalogSelectionModalOpen,
    settingsTab, setSettingsTab, showClientPopup, setShowClientPopup, clientSearch, setClientSearch,
    pendingService, setPendingService, addedItemId, setAddedItemId, editingRecord, setEditingRecord,
    showPhotoAdjustment, setShowPhotoAdjustment, crop, setCrop, zoom, setZoom, croppedAreaPixels, setCroppedAreaPixels,
    newClient, setNewClient, visibleRecords, setVisibleRecords, selectedRecurrence, setSelectedRecurrence,
    totalBalance, monthlyStats, dailyStats, metaProgress, taskProgress, totalCommissions, upcomingReturns,
    addRecord, deleteRecord, updateRecord, revertRecord, addExpense, deleteExpense, openConfirmation,
    addCatalogService, deleteCatalogService, addCatalogProduct, deleteCatalogProduct,
    aiInsights, setAiInsights, strategicPrompt, setStrategicPrompt, marketTrends, setMarketTrends,
    loadingAI, setLoadingAI, loadingTrends, setLoadingTrends, confirmation
  } = useFlowBarber();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showClientPopup) {
      setTimeout(() => {
        clientSearchRef.current?.focus();
      }, 100);
    }
  }, [showClientPopup]);

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

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      {isCatalogSelectionModalOpen && (
        <CatalogSelectionModal
          isOpen={isCatalogSelectionModalOpen}
          onClose={() => setIsCatalogSelectionModalOpen(false)}
          servicos={data.servicos}
          produtos={data.produtos}
          onSelect={(item, categoria) => {
            addRecord(item.valor, item.nome, { nome: 'Cliente Avulso', tel: '' }, undefined, categoria);
            setIsCatalogSelectionModalOpen(false);
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
          {mainTab === 'inicio' && <DashboardTab />}

          {/* FAB */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMetricsDrawer(true)}
            className="fixed bottom-6 right-6 p-4 bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-lg z-50 text-slate-900"
          >
            <ChartColumn size={24} />
          </motion.button>

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

          {mainTab === 'agenda' && <AgendaTab />}
          {mainTab === 'analytics' && <AnalyticsTab />}

          {mainTab === 'historico' && <HistoricoTab exportToCSV={exportToCSV} />}

          {mainTab === 'despesas' && (
            <ExpensesTab 
              expenses={data.despesas} 
              addExpense={addExpense} 
              deleteExpense={deleteExpense} 
              totalRevenue={data.historico.filter(r => r.tipo === 'entrada').reduce((acc, r) => acc + r.valor, 0)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mini FAB para Metas */}
      {isLoggedIn && mainTab === 'inicio' && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: -10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPerformancePanel(true)}
          className="fixed bottom-24 right-6 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-all z-40"
          aria-label="Ver Metas e Performance"
        >
          <Target size={20} />
        </motion.button>
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
            active={mainTab === 'despesas'} 
            onClick={() => setMainTab('despesas')} 
            icon={<Briefcase size={22} />} 
            label="Despesas" 
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
          <SettingsPopup 
            exportToCSV={exportToCSV}
            fileInputRef={fileInputRef}
          />
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
                      .map((c) => (
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
                          id: generateId(),
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
  <motion.button 
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    aria-label={label}
    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all relative group ${
      active ? 'bg-slate-900 text-white shadow-lg ring-4 ring-slate-900/10' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
      />
    )}
  </motion.button>
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
