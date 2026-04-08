import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { dashboardApi, casesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  CheckCircle, 
  Archive, 
  Clock, 
  XCircle, 
  Loader,
  Users,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#09090B', '#52525B', '#A1A1AA', '#D4D4D8', '#E4E4E7'];
const GENDER_COLORS = ['#1E40AF', '#9A3412'];

function StatCard({ title, value, icon: Icon, color = 'zinc', subtitle }) {
  const colorClasses = {
    zinc: 'border-zinc-200',
    green: 'border-[#166534]',
    orange: 'border-[#9A3412]',
    red: 'border-[#991B1B]',
    blue: 'border-[#1E40AF]',
    gray: 'border-[#3F3F46]'
  };

  return (
    <div className={`bg-white border ${colorClasses[color]} p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-mono-label text-zinc-500 text-xs mb-2">{title}</p>
          <p className="text-4xl font-black tracking-tight text-zinc-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-zinc-50">
          <Icon className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEdit } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, casesData] = await Promise.all([
        dashboardApi.getStats(),
        casesApi.list({ limit: 5 })
      ]);
      setStats(statsData);
      setRecentCases(casesData.cases);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </Layout>
    );
  }

  const genderData = [
    { name: 'Masculino', value: stats?.masculino || 0 },
    { name: 'Feminino', value: stats?.feminino || 0 }
  ];

  return (
    <Layout 
      title="Dashboard" 
      actions={
        canEdit() && (
          <Link to="/casos/novo">
            <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" data-testid="new-case-header-btn">
              Novo Caso
            </Button>
          </Link>
        )
      }
    >
      <div className="space-y-8" data-testid="dashboard-view">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Casos"
            value={stats?.total || 0}
            icon={FileText}
          />
          <StatCard
            title="Processados"
            value={stats?.processados || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Pendentes"
            value={stats?.pendentes || 0}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Em Processo"
            value={stats?.em_processo || 0}
            icon={Loader}
            color="blue"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Arquivados"
            value={stats?.arquivados || 0}
            icon={Archive}
            color="gray"
          />
          <StatCard
            title="Anulados"
            value={stats?.anulados || 0}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Taxa de Resolução"
            value={stats?.total > 0 ? `${Math.round(((stats?.processados || 0) / stats.total) * 100)}%` : '0%'}
            icon={TrendingUp}
            subtitle="Casos processados"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases by Type */}
          <div className="bg-white border border-zinc-200 p-6">
            <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Casos por Tipo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.by_type || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="tipo" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      border: '1px solid #E4E4E7', 
                      borderRadius: 0,
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="count" fill="#09090B" name="Casos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white border border-zinc-200 p-6">
            <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Distribuição por Gênero</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      border: '1px solid #E4E4E7', 
                      borderRadius: 0,
                      fontSize: 12 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#1E40AF]"></div>
                <span className="text-sm text-zinc-600">Masculino ({stats?.masculino || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#9A3412]"></div>
                <span className="text-sm text-zinc-600">Feminino ({stats?.feminino || 0})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cases by Unit */}
        <div className="bg-white border border-zinc-200 p-6">
          <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Casos por Unidade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.by_unit || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis 
                  dataKey="unidade" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    border: '1px solid #E4E4E7', 
                    borderRadius: 0,
                    fontSize: 12
                  }}
                />
                <Bar dataKey="count" fill="#52525B" name="Casos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white border border-zinc-200">
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="text-mono-label text-xs text-zinc-500">Casos Recentes</h3>
            <Link to="/casos" className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Refere a</th>
                  <th>Tipo</th>
                  <th>Unidade</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((caso) => (
                  <tr key={caso.id}>
                    <td>
                      <Link 
                        to={`/casos/${caso.id}`} 
                        className="font-mono text-sm font-semibold text-zinc-900 hover:underline"
                        data-testid={`case-link-${caso.id}`}
                      >
                        {caso.numero}
                      </Link>
                    </td>
                    <td className="font-medium">{caso.refere_ao}</td>
                    <td className="text-zinc-600">{caso.tipo_caso}</td>
                    <td className="text-zinc-600">{caso.componente_unidade}</td>
                    <td><StatusBadge status={caso.status} /></td>
                    <td className="text-zinc-500 font-mono text-sm">{caso.data_registo}</td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-zinc-500 py-8">
                      Nenhum caso encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
