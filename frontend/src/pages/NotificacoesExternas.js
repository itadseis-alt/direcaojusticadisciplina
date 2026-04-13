import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { notifExternaApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Loader, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { PasswordDialog } from '@/components/PasswordDialog';

const qualidades = ['Suspeito', 'Arguido', 'Testemunha'];

export default function NotificacoesExternas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notificacoes, setNotificacoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('nome') || '');
  const [qualidade, setQualidade] = useState(searchParams.get('qualidade') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState(null);
  const { user, canEdit } = useAuth();

  const isSuperAdmin = user?.tipo === 'super_admin';

  useEffect(() => { loadData(); }, [page, limit, qualidade]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.nome = search;
      if (qualidade && qualidade !== 'all') params.qualidade = qualidade;
      const data = await notifExternaApi.list(params);
      setNotificacoes(data.notificacoes || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    loadData();
  };

  const handleDelete = async () => {
    try {
      await notifExternaApi.delete(deleteId);
      toast.success('Notificação excluída');
      setDeleteId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900" data-testid="ne-page-title">
            Notificações Externas
          </h1>
          {canEdit() && (
            <Link to="/notificacoes-externas/nova">
              <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" data-testid="ne-add-btn">
                <Plus className="w-4 h-4 mr-2" /> Nova Notificação
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Buscar por nome ou NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-none"
                data-testid="ne-search-input"
              />
            </div>
            <Select value={qualidade} onValueChange={(v) => { setQualidade(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] rounded-none" data-testid="ne-qualidade-filter">
                <SelectValue placeholder="Qualidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Qualidades</SelectItem>
                {qualidades.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" className="rounded-none" data-testid="ne-search-btn">
              <Search className="w-4 h-4 mr-1" /> Buscar
            </Button>
          </form>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500" data-testid="ne-count">
            {total} notificação(ões) encontrada(s)
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Mostrar</span>
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8 rounded-none text-sm" data-testid="ne-page-size">
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
        {loading ? (
          <div className="flex justify-center py-20"><Loader className="w-6 h-6 animate-spin" /></div>
        ) : notificacoes.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-12 text-center">
            <p className="text-zinc-500">Nenhuma notificação externa encontrada</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 overflow-x-auto">
            <table className="w-full text-sm" data-testid="ne-table">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">NO</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">DATA ENTRADA</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">NIM</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">NOME</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">POSTO</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">UNIDADE</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">QUALIDADE</th>
                  <th className="text-left p-3 text-mono-label text-xs text-zinc-500">TIPO</th>
                  <th className="text-right p-3 text-mono-label text-xs text-zinc-500">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {notificacoes.map((n) => (
                  <tr key={n.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-mono font-bold">{n.numero}</td>
                    <td className="p-3">{n.data_entrada}</td>
                    <td className="p-3 font-mono">{n.nim}</td>
                    <td className="p-3 font-semibold">{n.nome_completo}</td>
                    <td className="p-3">{n.posto}</td>
                    <td className="p-3">{n.componente_unidade}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-1 border ${
                        n.qualidade === 'Suspeito' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                        n.qualidade === 'Arguido' ? 'border-red-300 text-red-700 bg-red-50' :
                        'border-blue-300 text-blue-700 bg-blue-50'
                      }`}>
                        {n.qualidade}
                      </span>
                    </td>
                    <td className="p-3">{n.tipo_caso}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/notificacoes-externas/${n.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`ne-detail-${n.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {canEdit() && (
                          <Link to={`/notificacoes-externas/${n.id}/editar`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`ne-edit-${n.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        {isSuperAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" 
                            onClick={() => setDeleteId(n.id)} data-testid={`ne-delete-${n.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-none h-8 px-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                .map((p, idx) => p === '...' ? <span key={`d-${idx}`} className="px-1 text-zinc-400">...</span> : (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}
                    className={`rounded-none h-8 w-8 p-0 ${p === page ? 'bg-zinc-900 text-white' : ''}`}>{p}</Button>
                ))}
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-none h-8 px-2">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      {deleteId && (
        <PasswordDialog
          open={!!deleteId}
          onOpenChange={(open) => { if (!open) setDeleteId(null); }}
          onConfirm={handleDelete}
          title="Excluir Notificação Externa"
          description="Esta ação não pode ser desfeita. Digite sua senha para confirmar."
        />
      )}
    </Layout>
  );
}
