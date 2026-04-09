import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { casesApi, dashboardApi } from '@/lib/api';
import { 
  Loader,
  Download,
  Printer,
  FileText,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
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
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

const unidades = [
  'Todas as Unidades',
  'Unidade Apoio Quartel General',
  'Quartel General',
  'Componente Força Terrestre (CFT)',
  'Componente Força Naval (CFN)',
  'Componente Aérea Ligeira (CAL)',
  'Força Apoio Geral (FAG)',
  'Unidade Apoio Serviço (UAS)',
  'Centro de Instrução do Comandante Nicolau Lobato (CICNL)',
  'Unidade de Polícia Militar (PM)',
  'Unidade FALINTIL (UF)',
  '1º Batalhão da CFT',
  '2º Batalhão da CFT',
  'Companhia de Engenharia',
  'Companhia de Transmissões',
  'Corpo Fuzileiros'
];

const STATUS_COLORS = {
  processado: '#166534',
  arquivado: '#3F3F46',
  pendente: '#9A3412',
  anulado: '#991B1B',
  em_processo: '#1E40AF'
};

const STATUS_LABELS = {
  processado: 'Processado',
  arquivado: 'Arquivado',
  pendente: 'Pendente',
  anulado: 'Anulado',
  em_processo: 'Em Processo'
};

export default function Reports() {
  const [selectedUnidade, setSelectedUnidade] = useState('Todas as Unidades');
  const [selectedYear, setSelectedYear] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [cases, setCases] = useState([]);

  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Get available years from cases
  const availableYears = useMemo(() => {
    const years = new Set();
    cases.forEach(c => {
      const date = c.data_registo || c.data_incidente;
      if (date) years.add(date.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [cases]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    if (!cases.length) return [];

    if (selectedYear === 'todos') {
      // Group by year
      const byYear = {};
      cases.forEach(c => {
        const date = c.data_registo || c.data_incidente;
        if (date) {
          const year = date.substring(0, 4);
          byYear[year] = (byYear[year] || 0) + 1;
        }
      });
      return Object.entries(byYear)
        .map(([ano, total]) => ({ periodo: ano, total }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
    } else {
      // Group by month for selected year
      const byMonth = {};
      MONTH_NAMES.forEach((m, i) => { byMonth[i] = 0; });
      cases.forEach(c => {
        const date = c.data_registo || c.data_incidente;
        if (date && date.startsWith(selectedYear)) {
          const month = parseInt(date.substring(5, 7)) - 1;
          byMonth[month] = (byMonth[month] || 0) + 1;
        }
      });
      return MONTH_NAMES.map((nome, i) => ({ periodo: nome, total: byMonth[i] }));
    }
  }, [cases, selectedYear]);

  useEffect(() => {
    loadReportData();
  }, [selectedUnidade]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Fetch cases
      const params = {};
      if (selectedUnidade !== 'Todas as Unidades') {
        params.unidade = selectedUnidade;
      }
      const casesData = await casesApi.list({ ...params, limit: 1000 });
      setCases(casesData.cases);

      // Calculate stats
      const stats = {
        total: casesData.cases.length,
        processados: casesData.cases.filter(c => c.status === 'processado').length,
        arquivados: casesData.cases.filter(c => c.status === 'arquivado').length,
        pendentes: casesData.cases.filter(c => c.status === 'pendente').length,
        em_processo: casesData.cases.filter(c => c.status === 'em_processo').length,
        anulados: casesData.cases.filter(c => c.status === 'anulado').length,
        masculino: casesData.cases.filter(c => c.sexo === 'M').length,
        feminino: casesData.cases.filter(c => c.sexo === 'F').length
      };

      // Calculate by type
      const byType = {};
      casesData.cases.forEach(c => {
        byType[c.tipo_caso] = (byType[c.tipo_caso] || 0) + 1;
      });

      // Calculate by sanction
      const bySanction = {};
      casesData.cases.filter(c => c.tipo_sancao).forEach(c => {
        bySanction[c.tipo_sancao] = (bySanction[c.tipo_sancao] || 0) + 1;
      });

      // Calculate by posto
      const byPosto = {};
      casesData.cases.forEach(c => {
        byPosto[c.posto] = (byPosto[c.posto] || 0) + 1;
      });

      setReportData({
        stats,
        byType: Object.entries(byType).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count),
        bySanction: Object.entries(bySanction).map(([sancao, count]) => ({ sancao, count })).sort((a, b) => b.count - a.count),
        byPosto: Object.entries(byPosto).map(([posto, count]) => ({ posto, count })).sort((a, b) => b.count - a.count).slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await casesApi.export(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${selectedUnidade.replace(/[^a-zA-Z0-9]/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exportado com sucesso`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusData = reportData ? [
    { name: 'Processado', value: reportData.stats.processados, color: STATUS_COLORS.processado },
    { name: 'Arquivado', value: reportData.stats.arquivados, color: STATUS_COLORS.arquivado },
    { name: 'Pendente', value: reportData.stats.pendentes, color: STATUS_COLORS.pendente },
    { name: 'Em Processo', value: reportData.stats.em_processo, color: STATUS_COLORS.em_processo },
    { name: 'Anulado', value: reportData.stats.anulados, color: STATUS_COLORS.anulado }
  ].filter(s => s.value > 0) : [];

  const genderData = reportData ? [
    { name: 'Masculino', value: reportData.stats.masculino, color: '#1E40AF' },
    { name: 'Feminino', value: reportData.stats.feminino, color: '#9A3412' }
  ].filter(g => g.value > 0) : [];

  return (
    <Layout 
      title="Relatórios por Unidade"
      actions={
        <div className="flex items-center gap-2 no-print">
          <Button 
            variant="outline" 
            className="rounded-none border-zinc-200"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            variant="outline" 
            className="rounded-none border-zinc-200"
            onClick={() => handleExport('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            className="rounded-none border-zinc-200"
            onClick={() => handleExport('xlsx')}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      }
    >
      <div className="space-y-6" data-testid="reports-view">
        {/* Print Header */}
        <div className="print-header text-center mb-8 pb-4 border-b-2 border-zinc-900">
          <div className="flex justify-center mb-4">
            <img src="/ffdtl-logo.png" alt="F-FDTL Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wide">FALINTIL - Força de Defesa de Timor-Leste</h1>
          <h2 className="text-base font-semibold mt-1">Direção Justiça e Disciplina</h2>
          <div className="mt-4 pt-4 border-t border-zinc-300">
            <p className="text-lg font-bold">RELATÓRIO DE CASOS DISCIPLINARES</p>
            <p className="text-sm mt-1">{selectedUnidade}</p>
            <p className="text-xs text-zinc-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white border border-zinc-200 p-4 no-print">
          <div className="flex flex-wrap items-center gap-4">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
              <SelectTrigger className="w-[350px] rounded-none" data-testid="unit-filter">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Calendar className="w-5 h-5 text-zinc-400 ml-2" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] rounded-none" data-testid="year-filter">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo Período</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : reportData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-zinc-200 p-4 text-center">
                <p className="text-3xl font-black text-zinc-900">{reportData.stats.total}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Total</p>
              </div>
              <div className="bg-white border border-[#166534] p-4 text-center">
                <p className="text-3xl font-black text-[#166534]">{reportData.stats.processados}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Processados</p>
              </div>
              <div className="bg-white border border-[#9A3412] p-4 text-center">
                <p className="text-3xl font-black text-[#9A3412]">{reportData.stats.pendentes}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Pendentes</p>
              </div>
              <div className="bg-white border border-[#1E40AF] p-4 text-center">
                <p className="text-3xl font-black text-[#1E40AF]">{reportData.stats.em_processo}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Em Processo</p>
              </div>
              <div className="bg-white border border-[#3F3F46] p-4 text-center">
                <p className="text-3xl font-black text-[#3F3F46]">{reportData.stats.arquivados}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Arquivados</p>
              </div>
              <div className="bg-white border border-[#991B1B] p-4 text-center">
                <p className="text-3xl font-black text-[#991B1B]">{reportData.stats.anulados}</p>
                <p className="text-mono-label text-xs text-zinc-500 mt-1">Anulados</p>
              </div>
            </div>

            {/* Monthly/Yearly Evolution */}
            <div className="bg-white border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-mono-label text-xs text-zinc-500">
                  {selectedYear === 'todos' ? 'Evolução Anual de Casos' : `Casos por Mês - ${selectedYear}`}
                </h3>
                <span className="text-xs text-zinc-400">
                  {monthlyStats.reduce((sum, m) => sum + m.total, 0)} caso(s) no período
                </span>
              </div>
              <div className="h-72" data-testid="monthly-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      formatter={(value) => [`${value} caso(s)`, 'Total']}
                      contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 0 }}
                    />
                    <Bar dataKey="total" fill="#1E40AF" name="Casos" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white border border-zinc-200 p-6">
                <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Distribuição por Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white border border-zinc-200 p-6">
                <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Distribuição por Gênero</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Cases by Type */}
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Casos por Tipo de Infração</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.byType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis type="number" />
                    <YAxis dataKey="tipo" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#09090B" name="Casos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cases by Sanction */}
            {reportData.bySanction.length > 0 && (
              <div className="bg-white border border-zinc-200 p-6">
                <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Casos por Tipo de Sanção</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.bySanction}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                      <XAxis dataKey="sancao" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#166534" name="Casos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Cases by Posto */}
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="text-mono-label text-xs text-zinc-500 mb-6">Top 10 - Casos por Posto</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.byPosto} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis type="number" />
                    <YAxis dataKey="posto" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#52525B" name="Casos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white border border-zinc-200">
              <div className="p-4 border-b border-zinc-200">
                <h3 className="text-mono-label text-xs text-zinc-500">Lista Detalhada de Casos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Membro</th>
                      <th>Posto</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Sanção</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.slice(0, 50).map((caso) => (
                      <tr key={caso.id}>
                        <td className="font-mono text-sm">{caso.numero}</td>
                        <td className="font-medium">{caso.refere_ao}</td>
                        <td>{caso.posto}</td>
                        <td>{caso.tipo_caso}</td>
                        <td>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase status-${caso.status}`}>
                            {STATUS_LABELS[caso.status]}
                          </span>
                        </td>
                        <td>{caso.tipo_sancao || '-'}</td>
                        <td className="font-mono text-sm">{caso.data_registo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cases.length > 50 && (
                <div className="p-4 border-t border-zinc-200 text-center">
                  <p className="text-sm text-zinc-500">
                    Mostrando 50 de {cases.length} casos. Exporte para ver todos.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
