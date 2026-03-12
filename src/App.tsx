/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, Users, Calendar, TrendingUp, History, Plus, Settings, 
  LogOut, Share2, Trash2, Search, ChevronLeft, ChevronRight,
  Target, DollarSign, CheckCircle2, Clock, RefreshCw, LayoutGrid,
  ChartColumn, AlertCircle, Moon, Sun, Briefcase, Coffee, Package,
  Sparkles, Pencil, Download, X, FileText, User
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

import { Card } from './components/Card';
import { MetricsSection } from './components/MetricsSection';
import { MetricsDrawer } from './components/MetricsDrawer';
import { ReportModal } from './components/ReportModal';
import { ServiceModal } from './components/ServiceModal';
import { AppData, DEFAULT_DATA, HistoryRecord } from './types';
import { getAIInsights, getMarketTrends } from './services/geminiService';

// --- Utils ---
const formatCurrency = (v: number) => 
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

export default function App() {
  // 1. LOGIN PERSISTENTE (Mudado para localStorage)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('flowBarberLoggedIn') === '1';
  });

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('flowBarberData');
    if (!saved) return DEFAULT_DATA;
    try {
      return { ...DEFAULT_DATA, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_DATA;
    }
  });

  // Guardar dados e login sempre que mudarem
  useEffect(() => {
    localStorage.setItem('flowBarberData', JSON.stringify(data));
    localStorage.setItem('flowBarberLoggedIn', isLoggedIn ? '1' : '0');
  }, [data, isLoggedIn]);

  const [darkMode, setDarkMode] = useState(true);
  const [mainTab, setMainTab] = useState<'inicio' | 'agenda' | 'analytics' | 'historico' | 'config'>('inicio');
  const [imgError, setImgError] = useState(false);

  // --- Funções de Login ---
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('flowBarberLoggedIn');
  };

  // Se não estiver logado, mostra a tela de Login Responsiva
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-black'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-500/20 rounded-2xl">
              <Scissors className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black mb-2 text-emerald-500">Flow Barber</h1>
          <p className="text-zinc-400 mb-8">Gestão inteligente para a tua barbearia</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            Entrar no Painel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* HEADER RESPONSIVO */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {data.perfil?.foto && !imgError ? (
                <img 
                  src={data.perfil.foto} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)} 
                />
              ) : (
                <User className="w-6 h-6 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Bem-vindo,</p>
              <p className="text-sm font-bold truncate max-w-[120px]">{data.perfil?.nome || 'Barbeiro'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL COM PADDING LATERAL PARA MOBILE */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Card de Saldo Fluido */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-600 border-none p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="opacity-80 text-sm font-medium uppercase tracking-wider">Saldo Disponível</p>
              <h2 className="text-4xl font-black mt-1">{formatCurrency(data.saldo || 0)}</h2>
            </div>
            <Scissors className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
          </Card>
          
          {/* Outros cards aqui... */}
        </section>

        {/* MENSAGEM DE ERRO/AVISO CASO NÃO HAJA DADOS */}
        {data.servicos.length === 0 && (
          <div className="p-8 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhum serviço configurado. Começa por adicionar um no menu de configurações.</p>
          </div>
        )}

      </main>

      {/* NAVEGAÇÃO INFERIOR FIXA (MOBILE FRIENDLY) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton active={mainTab === 'inicio'} icon={<LayoutGrid size={24}/>} onClick={() => setMainTab('inicio')} />
          <NavButton active={mainTab === 'agenda'} icon={<Calendar size={24}/>} onClick={() => setMainTab('agenda')} />
          <div className="relative -top-8">
             <button className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-900/40 text-white active:scale-90 transition-transform">
                <Plus size={28} font-black />
             </button>
          </div>
          <NavButton active={mainTab === 'analytics'} icon={<ChartColumn size={24}/>} onClick={() => setMainTab('analytics')} />
          <NavButton active={mainTab === 'config'} icon={<Settings size={24}/>} onClick={() => setMainTab('config')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 transition-all ${active ? 'text-emerald-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {icon}
    </button>
  );
}
