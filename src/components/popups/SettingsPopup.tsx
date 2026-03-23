import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Pencil, ChartColumn, Users, X, Plus, Trash2 } from 'lucide-react';
import { useFlowBarber } from '../../context/FlowBarberContext';
import { Popup } from '../Popup';

interface SettingsPopupProps {
  exportToCSV: (data: any[], filename: string, isHistory?: boolean) => void;
  addCatalogService: () => void;
  deleteCatalogService: (id: string) => void;
  addCatalogProduct: () => void;
  deleteCatalogProduct: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function SettingsPopup({
  exportToCSV,
  addCatalogService,
  deleteCatalogService,
  addCatalogProduct,
  deleteCatalogProduct,
  fileInputRef
}: SettingsPopupProps) {
  const {
    data,
    setData,
    settingsTab,
    setSettingsTab,
    setShowSettingsPopup,
    setShowReportModal,
    setErrorToast
  } = useFlowBarber();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.barberName || "Flow Barber");

  return (
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Valor da Meta Financeira (€)</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Meta Diária (Serviços)</label>
                <input 
                  type="number" 
                  defaultValue={data.metaDiariaServicos || 0}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    setData(prev => ({ ...prev, metaDiariaServicos: val }));
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-lg text-slate-900 text-center"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Meta Semanal (Serviços)</label>
                <input 
                  type="number" 
                  defaultValue={data.metaSemanalServicos || 0}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    setData(prev => ({ ...prev, metaSemanalServicos: val }));
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-lg text-slate-900 text-center"
                />
              </div>
            </div>

            <button onClick={() => setShowSettingsPopup(false)} className="btn-primary w-full py-5 rounded-[32px] uppercase tracking-widest text-xs font-black">Salvar Metas</button>
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
                    <div key={s.id} className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 transition-all overflow-hidden">
                      <input 
                        type="text" 
                        value={s.nome}
                        onChange={(e) => {
                          const newServicos = [...data.servicos];
                          newServicos[i].nome = e.target.value;
                          setData(prev => ({ ...prev, servicos: newServicos }));
                        }}
                        className="flex-1 min-w-0 p-1 rounded-lg bg-transparent font-black text-xs text-slate-900 outline-none"
                      />
                      <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-100 shrink-0">
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
                          className="w-10 p-1 bg-transparent font-black text-xs text-emerald-500 outline-none text-right"
                        />
                      </div>
                      <button 
                        onClick={() => deleteCatalogService(s.id)}
                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={addCatalogService}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] hover:border-emerald-500/30 hover:text-emerald-500 hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-widest"
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
                    <div key={p.id} className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-cyan-500/30 transition-all overflow-hidden">
                      <input 
                        type="text" 
                        value={p.nome}
                        onChange={(e) => {
                          const newProdutos = [...data.produtos];
                          newProdutos[i].nome = e.target.value;
                          setData(prev => ({ ...prev, produtos: newProdutos }));
                        }}
                        className="flex-1 min-w-0 p-1 rounded-lg bg-transparent font-black text-xs text-slate-900 outline-none"
                      />
                      <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-100 shrink-0">
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
                          className="w-10 p-1 bg-transparent font-black text-xs text-cyan-500 outline-none text-right"
                        />
                      </div>
                      <button 
                        onClick={() => deleteCatalogProduct(p.id)}
                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={addCatalogProduct}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] hover:border-cyan-500/30 hover:text-cyan-500 hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-widest"
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
  );
}
