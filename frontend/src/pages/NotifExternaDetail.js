import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { notifExternaApi, filesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Loader, Edit, Trash2, Printer, User, FileText, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PasswordDialog } from '@/components/PasswordDialog';

export default function NotifExternaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const { user, canEdit } = useAuth();

  const isSuperAdmin = user?.tipo === 'super_admin';

  useEffect(() => { loadNotif(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotif = async () => {
    try {
      const data = await notifExternaApi.get(id);
      setNotif(data);
    } catch (error) {
      toast.error('Erro ao carregar notificação');
      navigate('/notificacoes-externas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await notifExternaApi.delete(id);
      toast.success('Notificação excluída');
      navigate('/notificacoes-externas');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><Loader className="w-6 h-6 animate-spin" /></div></Layout>;
  }

  if (!notif) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <button onClick={() => navigate('/notificacoes-externas')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" /> Voltar para lista
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-none" onClick={handlePrint} data-testid="ne-print-btn">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            {canEdit() && (
              <Link to={`/notificacoes-externas/${id}/editar`}>
                <Button variant="outline" className="rounded-none" data-testid="ne-edit-btn">
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </Link>
            )}
            {isSuperAdmin && (
              <Button variant="outline" className="rounded-none text-red-600" onClick={() => setDeleteDialog(true)} data-testid="ne-delete-btn">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            )}
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/ffdtl-logo.png" alt="F-FDTL" className="w-16 h-16" />
            <div>
              <h1 className="text-lg font-bold">FALINTIL - Forças de Defesa de Timor-Leste</h1>
              <p className="text-sm">Direção de Justiça e Disciplina</p>
              <p className="text-sm font-semibold">Notificação Externa N.º {notif.numero}</p>
            </div>
          </div>
          <hr className="border-zinc-400 my-2" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight print:hidden" data-testid="ne-detail-title">
          Notificação Externa N.º {notif.numero}
        </h1>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Data */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 p-6">
            <h2 className="text-mono-label text-xs text-zinc-500 mb-4">DADOS DO NOTIFICADO</h2>
            <div className="flex gap-6">
              {notif.foto_url ? (
                <img src={filesApi.getUrl(notif.foto_url)} alt="Foto" className="w-24 h-28 object-cover border border-zinc-200" />
              ) : (
                <div className="w-24 h-28 bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-zinc-300" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                <div><p className="text-mono-label text-xs text-zinc-400">NOME</p><p className="font-semibold">{notif.nome_completo}</p></div>
                <div><p className="text-mono-label text-xs text-zinc-400">NIM</p><p className="font-mono">{notif.nim}</p></div>
                <div><p className="text-mono-label text-xs text-zinc-400">POSTO</p><p>{notif.posto}</p></div>
                <div><p className="text-mono-label text-xs text-zinc-400">SEXO</p><p>{notif.sexo === 'M' ? 'Masculino' : 'Feminino'}</p></div>
                <div><p className="text-mono-label text-xs text-zinc-400">UNIDADE</p><p>{notif.componente_unidade}</p></div>
                <div>
                  <p className="text-mono-label text-xs text-zinc-400">QUALIDADE</p>
                  <span className={`text-xs font-semibold px-2 py-1 border ${
                    notif.qualidade === 'Suspeito' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                    notif.qualidade === 'Arguido' ? 'border-red-300 text-red-700 bg-red-50' :
                    'border-blue-300 text-blue-700 bg-blue-50'
                  }`}>{notif.qualidade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Data */}
          <div className="bg-white border border-zinc-200 p-6">
            <h2 className="text-mono-label text-xs text-zinc-500 mb-4">DADOS DA NOTIFICAÇÃO</h2>
            <div className="space-y-3">
              <div><p className="text-mono-label text-xs text-zinc-400">NÚMERO</p><p className="text-2xl font-black">{notif.numero}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">DATA ENTRADA</p><p>{notif.data_entrada}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">TIPO CASO</p><p>{notif.tipo_caso || '-'}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">NU. NUC</p><p className="font-mono">{notif.nu_nuc || '-'}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">DATA APRESENTAÇÃO</p><p>{notif.data_apresenta || '-'}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">HORAS</p><p>{notif.horas || '-'}</p></div>
              <div><p className="text-mono-label text-xs text-zinc-400">REGISTRADO POR</p><p>{notif.created_by_nome}</p></div>
            </div>
          </div>
        </div>

        {/* Attachments and Observation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {notif.despacho_url && (
            <div className="bg-white border border-zinc-200 p-6">
              <h2 className="text-mono-label text-xs text-zinc-500 mb-4">DESPACHO</h2>
              <a href={filesApi.getUrl(notif.despacho_url)} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 border border-zinc-200 hover:bg-zinc-50 transition-colors">
                <FileText className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm font-semibold">Documento de Despacho</p>
                  <p className="text-xs text-zinc-500">Clique para abrir o PDF</p>
                </div>
                <Download className="w-4 h-4 text-zinc-400 ml-auto" />
              </a>
            </div>
          )}

          {notif.observacao && (
            <div className="bg-white border border-zinc-200 p-6">
              <h2 className="text-mono-label text-xs text-zinc-500 mb-4">OBSERVAÇÃO</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{notif.observacao}</p>
            </div>
          )}
        </div>
      </div>

      {deleteDialog && (
        <PasswordDialog
          open={deleteDialog}
          onOpenChange={setDeleteDialog}
          onConfirm={handleDelete}
          title="Excluir Notificação Externa"
          description="Esta ação não pode ser desfeita. Digite sua senha para confirmar."
        />
      )}
    </Layout>
  );
}
