import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { logsApi } from '@/lib/api';
import { 
  Loader,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  FileText,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const actionIcons = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE_USER: Plus,
  UPDATE_USER: Edit,
  DELETE_USER: Trash2,
  CREATE_CASE: FileText,
  UPDATE_CASE: Edit,
  DELETE_CASE: Trash2,
  UPDATE_STATUS: Activity,
  PROCESS_CASE: Activity,
  CHANGE_PASSWORD: User
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await logsApi.list(page, limit);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getActionIcon = (acao) => {
    const Icon = actionIcons[acao] || Activity;
    return Icon;
  };

  const formatAction = (acao) => {
    const actions = {
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      CREATE_USER: 'Criou usuário',
      UPDATE_USER: 'Atualizou usuário',
      DELETE_USER: 'Deletou usuário',
      CREATE_CASE: 'Criou caso',
      UPDATE_CASE: 'Atualizou caso',
      DELETE_CASE: 'Deletou caso',
      UPDATE_STATUS: 'Atualizou status',
      PROCESS_CASE: 'Processou caso',
      CHANGE_PASSWORD: 'Alterou senha'
    };
    return actions[acao] || acao;
  };

  return (
    <Layout title="Log de Atividades">
      <div className="space-y-6" data-testid="activity-logs-view">
        {/* Info */}
        <div className="bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-sm text-zinc-600">
            Registro de todas as ações realizadas no sistema. Apenas Super Admin tem acesso a esta página.
          </p>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Logs List */}
        <div className="bg-white border border-zinc-200">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {logs.map((log) => {
                const Icon = getActionIcon(log.acao);
                return (
                  <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-zinc-100">
                        <Icon className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900">{log.user_nome}</span>
                          <span className="text-zinc-600">{formatAction(log.acao)}</span>
                        </div>
                        {log.detalhes && (
                          <p className="text-sm text-zinc-500 mt-1">{log.detalhes}</p>
                        )}
                        <p className="text-mono-label text-xs text-zinc-400 mt-2">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-center text-zinc-500 py-16">
                  Nenhum registro encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-none"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-none"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
