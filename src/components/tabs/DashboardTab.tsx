import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Package, Target, Sparkles, Search, ChartColumn } from 'lucide-react';
import { useFlowBarber } from '../../context/FlowBarberContext';
import { Card } from '../Card';
import { MetricsSection } from '../MetricsSection';
import { MetricsDrawer } from '../MetricsDrawer';

export default function DashboardTab() {
  const {
    data,
    totalBalance,
    totalCommissions,
    formatCurrency,
    activeTab,
    setActiveTab,
    addedItemId,
    setAddedItemId,
    addRecord,
    isLoggedIn,
    setShowPerformancePanel,
    metaProgress,
    dailyStats,
    monthlyStats,
    loadingAI,
    aiInsights,
    strategicPrompt,
    setLoadingAI,
    setAiInsights,
    loadingTrends,
    marketTrends,
    setLoadingTrends,
    setMarketTrends,
    showMetricsDrawer,
    setShowMetricsDrawer
  } = useFlowBarber();

  return (
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

          {/* Commissions Display */}
          <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Comissão Serviços</p>
              <p className="text-sm font-black text-emerald-600">{formatCurrency(totalCommissions.servicos)}</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Comissão Produtos</p>
              <p className="text-sm font-black text-cyan-600">{formatCurrency(totalCommissions.produtos)}</p>
            </div>
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
            key={activeTab}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-3 gap-2"
          >
            {(activeTab === 'servicos' ? data.servicos : data.produtos).map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.9, rotate: -1 }}
                onClick={() => {
                  const itemId = item.id;
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
                  addedItemId === item.id
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
              <div className="col-span-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiInsights.map((insight, i) => (
                    <div key={`insight-${insight.title}-${i}`} className="space-y-2">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{insight.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                    </div>
                  ))}
                </div>
                
                {strategicPrompt && (
                  <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-[24px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Sparkles size={40} className="text-indigo-600" />
                    </div>
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Sparkles size={12} />
                      Prompt Estratégico de Execução
                    </h4>
                    <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                      "{strategicPrompt}"
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                      Siga esta instrução para otimizar seus resultados hoje
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-3 flex flex-col items-center justify-center gap-2 text-center">
                <p className="text-xs text-slate-400 italic">Nenhum insight disponível no momento.</p>
                <button 
                  onClick={() => {
                    setLoadingAI(true);
                    // getAIInsights is handled in Context or App.tsx, but here we can trigger a refetch if needed
                    // For now, we'll just show the loading state
                    setTimeout(() => setLoadingAI(false), 2000);
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
                    setTimeout(() => setLoadingTrends(false), 2000);
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
  );
}
