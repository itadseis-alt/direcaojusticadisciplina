import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { casesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Loader,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_processo', label: 'Em Processo' },
  { value: 'processado', label: 'Processado' },
  { value: 'arquivado', label: 'Arquivado' },
  { value: 'anulado', label: 'Anulado' },
];

const postos = [
  // Oficiais Generais
  'General', 'Almirante', 'Tenente General', 'Vice Almirante', 
  'Major General', 'Contra Almirante', 'Brigadeiro General', 'Comodoro',
  // Oficiais Superiores
  'Coronel', 'Capitão-de-mar-e-guerra', 'Tenente-Coronel', 
  'Capitão de Fragata', 'Major', 'Capitão Tenente',
  // Oficiais Capitães e Subalternos
  'Capitão', 'Primeiro Tenente', 'Tenente', 'Segundo Tenente', 'Alferes', 'Subtenente',
  // Sargentos
  'Sargento Mor', 'Sargento Chefe', 'Sargento Ajudante', 'Primeiro Sargento', 'Segundo Sargento',
  // Praças
  'Cabo Secção', 'Cabo', 'Cabo Adjunto', 'Primeiro Marinheiro', 
  'Segundo Cabo', 'Primeiro Grumete', 'Soldado'
];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEdit } = useAuth();

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [posto, setPosto] = useState(searchParams.get('posto') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit')) || 10);

  useEffect(() => {
    loadCases();
  }, [status, posto, page, limit]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (status && status !== 'all') params.status = status;
      if (posto && posto !== 'all') params.posto = posto;
      if (search) params.search = search;

      const data = await casesApi.list(params);
      setCases(data.cases);
      setTotal(data.total);

      // Update URL params
      const newParams = new URLSearchParams();
      if (search) newParams.set('search', search);
      if (status && status !== 'all') newParams.set('status', status);
      if (posto && posto !== 'all') newParams.set('posto', posto);
      if (page > 1) newParams.set('page', page.toString());
      if (limit !== 10) newParams.set('limit', limit.toString());
      setSearchParams(newParams);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Erro ao carregar casos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadCases();
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await casesApi.export(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casos.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exportado com sucesso em ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPosto('all');
    setPage(1);
  };

  const hasFilters = search || status !== 'all' || posto !== 'all';
  const totalPages = Math.ceil(total / limit);

  return (
    <Layout 
      title="Casos Disciplinares"
      actions={
        <div className="flex items-center gap-2">
          {canEdit() && (
            <>
              <Button 
                variant="outline" 
                className="rounded-none border-zinc-200"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                data-testid="export-csv-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                className="rounded-none border-zinc-200"
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                data-testid="export-xlsx-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Link to="/casos/novo">
                <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" data-testid="new-case-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Caso
                </Button>
              </Link>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6" data-testid="case-list-view">
        {/* Filters */}
        <div className="bg-white border border-zinc-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, NIM ou número..."
                  className="pl-10 rounded-none"
                  data-testid="case-search-input"
                />
              </div>
            </div>
            
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] rounded-none" data-testid="case-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={posto} onValueChange={(v) => { setPosto(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] rounded-none" data-testid="case-filter-posto">
                <SelectValue placeholder="Posto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Postos</SelectItem>
                {postos.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline" className="rounded-none" data-testid="case-search-btn">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>

            {hasFilters && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={clearFilters}
                className="rounded-none"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </form>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500" data-testid="case-count-info">
            {total} caso{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Mostrar</span>
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8 rounded-none text-sm" data-testid="page-size-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>por página</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Refere a</th>
                    <th>NIM</th>
                    <th>Posto</th>
                    <th>Unidade</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caso) => (
                    <tr key={caso.id}>
                      <td>
                        <Link 
                          to={`/casos/${caso.id}`}
                          className="font-mono text-sm font-semibold text-zinc-900 hover:underline"
                          data-testid={`case-row-${caso.id}`}
                        >
                          {caso.numero}
                        </Link>
                      </td>
                      <td className="font-medium">{caso.refere_ao}</td>
                      <td className="font-mono text-sm">{caso.nim || '-'}</td>
                      <td>{caso.posto}</td>
                      <td>{caso.componente_unidade}</td>
                      <td className="text-zinc-600">{caso.tipo_caso}</td>
                      <td><StatusBadge status={caso.status} /></td>
                      <td className="font-mono text-sm text-zinc-500">{caso.data_registo}</td>
                    </tr>
                  ))}
                  {cases.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-zinc-500 py-16">
                        Nenhum caso encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="rounded-none h-8 px-2"
                data-testid="pagination-first"
              >
                <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-none h-8 px-2"
                data-testid="pagination-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-1 text-zinc-400">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={`rounded-none h-8 w-8 p-0 ${p === page ? 'bg-zinc-900 text-white' : ''}`}
                      data-testid={`pagination-page-${p}`}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-none h-8 px-2"
                data-testid="pagination-next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="rounded-none h-8 px-2"
                data-testid="pagination-last"
              >
                <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
