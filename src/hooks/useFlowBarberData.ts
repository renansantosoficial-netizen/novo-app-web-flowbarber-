import { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, DEFAULT_DATA, HistoryRecord, Contact, Service, Product } from '../types';
import { getAIInsights, getMarketTrends } from '../services/geminiService';

export function useFlowBarberData() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('flowBarberData');
    if (!saved) return DEFAULT_DATA;
    try {
      const parsed = JSON.parse(saved);
      
      const usedHistoricoIds = new Set();
      const historico = (parsed.historico || DEFAULT_DATA.historico).map((r: any) => {
        let id = r.id;
        if (!id || usedHistoricoIds.has(id)) id = generateId();
        usedHistoricoIds.add(id);
        return { ...r, id };
      });

      const usedContatoIds = new Set();
      const contatos = (parsed.contatos || DEFAULT_DATA.contatos).map((c: any) => {
        let id = c.id;
        if (!id || usedContatoIds.has(id)) id = generateId();
        usedContatoIds.add(id);
        return { ...c, id };
      });

      const usedServicoIds = new Set();
      const servicos = (parsed.servicos || DEFAULT_DATA.servicos).map((s: any) => {
        let id = s.id;
        if (!id || usedServicoIds.has(id)) id = generateId();
        usedServicoIds.add(id);
        return { ...s, id };
      });

      const usedProdutoIds = new Set();
      const produtos = (parsed.produtos || DEFAULT_DATA.produtos).map((p: any) => {
        let id = p.id;
        if (!id || usedProdutoIds.has(id)) id = generateId();
        usedProdutoIds.add(id);
        return { ...p, id };
      });

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
    const timeoutId = setTimeout(() => {
      localStorage.setItem('flowBarberData', JSON.stringify(data));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [data]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  return {
    data,
    setData,
    generateId
  };
}
