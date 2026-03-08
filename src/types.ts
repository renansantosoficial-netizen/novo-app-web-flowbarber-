export interface Service {
  nome: string;
  valor: number;
}

export interface Contact {
  id: number;
  nome: string;
  telefone: string;
  criadoEm: number;
  atualizadoEm: number;
}

export interface HistoryRecord {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string; // ISO string
  clienteNome?: string | null;
  clienteTelefone?: string | null;
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
  percentualGanho: number;
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
  percentualGanho: 50,
  diasFolga: [],
};
