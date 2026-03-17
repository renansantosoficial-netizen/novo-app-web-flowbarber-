export interface Service {
  id: string;
  nome: string;
  valor: number;
}

export interface Product {
  id: string;
  nome: string;
  valor: number;
}

export interface Contact {
  id: string;
  nome: string;
  telefone: string;
  criadoEm: number;
  atualizadoEm: number;
  recorrenciaPadrao?: number; // em dias
}

export interface HistoryRecord {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string; // ISO string
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  recorrencia?: number; // em dias
  categoria?: 'servico' | 'produto';
  editHistory?: {
    timestamp: string;
    oldData: Partial<HistoryRecord>;
  }[];
}

export interface SpecialEvent {
  id: string;
  data: string; // YYYY-MM-DD
  titulo: string;
  cor: string;
  tipo: 'feriado' | 'aniversario' | 'outro';
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
  folgasEspecificas?: Record<string, 'completo' | 'manha' | 'tarde'>;
  eventosEspeciais?: SpecialEvent[];
  barberName?: string;
  perfilUrl?: string;
}

export const DEFAULT_DATA: AppData = {
  saldo: 0,
  meta: 0,
  historico: [],
  contatos: [],
  servicos: [
    { id: "s1", nome: "Corte", valor: 20 },
    { id: "s2", nome: "Barba", valor: 10 },
    { id: "s3", nome: "Corte + Barba", valor: 25 },
    { id: "s4", nome: "Sobrancelha", valor: 8 },
  ],
  produtos: [
    { id: "p1", nome: "Pomada", valor: 35 },
    { id: "p2", nome: "Óleo de Barba", valor: 45 },
    { id: "p3", nome: "Shampoo", valor: 30 },
  ],
  percentualGanho: 50,
  percentualProdutos: 10,
  diasFolga: [],
  folgasEspecificas: {},
  eventosEspeciais: [],
  barberName: "Flow Barber",
};
