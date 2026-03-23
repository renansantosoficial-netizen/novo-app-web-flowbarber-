import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Briefcase, DollarSign, TrendingDown, TrendingUp, AlertCircle, Filter, Search, X } from 'lucide-react';
import { Card } from '../Card';
import { Expense } from '../../types';

interface ExpensesTabProps {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  totalRevenue: number;
}

const formatCurrency = (v: number) => 
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

const CATEGORIES = {
  fixa: ['Água', 'Luz', 'Telefone/Internet', 'Aluguel', 'Salários', 'Limpeza', 'Outros'],
  variavel: ['Cortes', 'Barbas', 'Produtos Específicos', 'Marketing', 'Manutenção', 'Outros']
};

export default function ExpensesTab({ expenses, addExpense, deleteExpense, totalRevenue }: ExpensesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'todos' | 'fixa' | 'variavel'>('todos');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    descricao: '',
    valor: 0,
    categoria: 'Outros',
    tipo: 'fixa',
    data: new Date().toISOString()
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesType = filterType === 'todos' || e.tipo === filterType;
      const matchesCategory = filterCategory === 'todas' || e.categoria === filterCategory;
      const matchesSearch = e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [expenses, filterType, filterCategory, searchTerm]);

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + e.valor, 0);
    const fixas = expenses.filter(e => e.tipo === 'fixa').reduce((acc, e) => acc + e.valor, 0);
    const variaveis = expenses.filter(e => e.tipo === 'variavel').reduce((acc, e) => acc + e.valor, 0);
    const netProfit = totalRevenue - total;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { total, fixas, variaveis, netProfit, margin };
  }, [expenses, totalRevenue]);

  const handleAdd = () => {
    if (newExpense.descricao && newExpense.valor > 0) {
      addExpense(newExpense);
      setShowAddModal(false);
      setNewExpense({
        descricao: '',
        valor: 0,
        categoria: 'Outros',
        tipo: 'fixa',
        data: new Date().toISOString()
      });
    }
  };

  const allAvailableCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach(e => cats.add(e.categoria));
    return Array.from(cats);
  }, [expenses]);

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Despesas</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Controle seus custos e lucro líquido</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          Nova Despesa
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Despesas</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Líquido</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.netProfit)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custos Fixos</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.fixas)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem de Lucro</p>
              <p className="text-2xl font-black text-slate-900">{stats.margin.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Descrição ou categoria..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo</label>
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="w-full sm:w-40 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </select>
        </div>

        <div className="w-full sm:w-auto space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
          <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full sm:w-48 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
          >
            <option value="todas">Todas as Categorias</option>
            {allAvailableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {(filterType !== 'todos' || filterCategory !== 'todas' || searchTerm) && (
          <button 
            onClick={() => {
              setFilterType('todos');
              setFilterCategory('todas');
              setSearchTerm('');
            }}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Limpar Filtros"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Expenses List */}
      <Card className="overflow-hidden border-none shadow-sm bg-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Lista de Despesas</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredExpenses.length} registros encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <AlertCircle size={48} />
                      <p className="font-black uppercase tracking-widest text-xs">Nenhuma despesa encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-600">{new Date(expense.data).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">{expense.descricao}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {expense.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        expense.tipo === 'fixa' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {expense.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-red-500">-{formatCurrency(expense.valor)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nova Despesa</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Despesa</label>
                      <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button 
                          onClick={() => setNewExpense(prev => ({ ...prev, tipo: 'fixa', categoria: CATEGORIES.fixa[0] }))}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newExpense.tipo === 'fixa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Fixa
                        </button>
                        <button 
                          onClick={() => setNewExpense(prev => ({ ...prev, tipo: 'variavel', categoria: CATEGORIES.variavel[0] }))}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newExpense.tipo === 'variavel' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Variável
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data</label>
                      <input 
                        type="date"
                        value={newExpense.data.split('T')[0]}
                        onChange={e => setNewExpense(prev => ({ ...prev, data: new Date(e.target.value).toISOString() }))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES[newExpense.tipo].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setNewExpense(prev => ({ ...prev, categoria: cat }))}
                          className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            newExpense.categoria === cat 
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' 
                              : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição Detalhada</label>
                    <input 
                      type="text"
                      value={newExpense.descricao}
                      onChange={e => setNewExpense(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Ex: Pagamento da conta de luz de Março"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor (€)</label>
                    <input 
                      type="number"
                      value={newExpense.valor || ''}
                      onChange={e => setNewExpense(prev => ({ ...prev, valor: parseFloat(e.target.value) }))}
                      placeholder="0.00"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 outline-none transition-all font-black text-2xl text-slate-900"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAdd}
                  disabled={!newExpense.descricao || newExpense.valor <= 0}
                  className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                  Confirmar Despesa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
