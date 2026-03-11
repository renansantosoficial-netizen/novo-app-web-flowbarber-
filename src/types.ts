export interface Service {
  nome: string;
  valor: number;
}

export interface Product {
  nome: string;
  valor: number;
}

export interface Contact {
  id: number;
  nome: string;
  telefone: string;
  criadoEm: number;
  atualizadoEm: number;
  recorrenciaPadrao?: number; // em dias
}

export interface HistoryRecord {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string; // ISO string
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  recorrencia?: number; // em dias
  categoria?: 'servico' | 'produto';
}

export interface DayOffConfig {
  dia: number; // 0-6
  periodo: 'completo' | 'manha' | 'tarde';
}

export interface AppData {
  saldo: number;
  meta: number;
  historico: HistoryRecord[];
  contatos: Contact[];
  servicos: Service[];
  produtos: Product[];
  percentualGanho: number;
  percentualProdutos: number;
  diasFolga: DayOffConfig[];
}

export const DEFAULT_DATA: AppData = {
  saldo: 0,
  meta: 0,
  historico: [],
  contatos: [],
  servicos: [
    { nome: "Corte", valor: 20 },
    { nome: "Barba", valor: 10 },
    { nome: "Corte + Barba", valor: 25 },
    { nome: "Sobrancelha", valor: 8 },
  ],
  produtos: [
    { nome: "Pomada", valor: 35 },
    { nome: "Óleo de Barba", valor: 45 },
    { nome: "Shampoo", valor: 30 },
  ],
  percentualGanho: 50,
  percentualProdutos: 10,
  diasFolga: [],
};
