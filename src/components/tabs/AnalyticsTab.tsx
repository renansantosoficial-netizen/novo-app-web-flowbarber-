import React from 'react';
import { motion } from 'framer-motion';
import { ChartColumn, Target, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar, AreaChart, Area } from 'recharts';
import { useFlowBarber } from '../../context/FlowBarberContext';
import { Card } from '../Card';

export default function AnalyticsTab() {
  const { chartData, formatCurrency } = useFlowBarber();

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <ChartColumn size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento por Categoria</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Serviços', value: chartData.categoryData.totalServicos },
                    { name: 'Produtos', value: chartData.categoryData.totalProdutos }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell key="cell-servicos" fill="#10b981" />
                  <Cell key="cell-produtos" fill="#6366f1" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 content-center">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Serviços</p>
              <h4 className="text-xl font-black text-slate-900">{formatCurrency(chartData.categoryData.totalServicos)}</h4>
              <p className="text-emerald-500 font-black text-[10px]">{chartData.categoryData.percentServicos.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Produtos</p>
              <h4 className="text-xl font-black text-slate-900">{formatCurrency(chartData.categoryData.totalProdutos)}</h4>
              <p className="text-indigo-500 font-black text-[10px]">{chartData.categoryData.percentProdutos.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <ChartColumn size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento por Dia (Mês Atual)</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 900 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `€${value}`}
                tick={{ fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#10b981', fontWeight: '900' }}
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              />
              <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Target size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento vs Meta</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.goalsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 900 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `€${value}`}
                tick={{ fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: '900' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="faturamento" fill="#10b981" radius={[8, 8, 0, 0]} name="Realizado" />
              <Bar dataKey="meta" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Meta" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <ChartColumn size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento Mensal</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 900 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `€${value}`}
                tick={{ fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#10b981', fontWeight: '900' }}
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                {chartData.monthlyData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#10b981' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-2xl">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento Anual</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.yearlyData}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 900 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `€${value}`}
                tick={{ fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
