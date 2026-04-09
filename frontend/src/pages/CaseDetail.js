import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { PasswordDialog } from '@/components/PasswordDialog';
import { casesApi, filesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Printer,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Loader,
  Download,
  CheckCircle,
  Archive,
  Clock,
  XCircle,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const sancoes = [
  'Repreensão (1 ano)',
  'Repreensão Agravada (1 ano)',
  'Detenção (5 anos)',
  'Prisão Disciplinar (10 anos)',
  'Prisão Disciplinar Agravada (10 anos)',
  'Reforma Compulsiva',
  'Separação do Serviço'
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  
  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [despachoFile, setDespachoFile] = useState(null);
  const [processPdfFile, setProcessPdfFile] = useState(null);
  const [processData, setProcessData] = useState({
    tipo_sancao: '',
    data_despacho: '',
    data_inicio: '',
    data_fim: '',
    oficial_instrutor: '',
    observacao: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      const data = await casesApi.get(id);
      setCaso(data);
    } catch (error) {
      console.error('Error loading case:', error);
      toast.error('Erro ao carregar caso');
      navigate('/casos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setPendingAction('edit');
    setPasswordDialogOpen(true);
  };

  const handleDelete = () => {
    setPendingAction('delete');
    setPasswordDialogOpen(true);
  };

  const onPasswordConfirm = () => {
    if (pendingAction === 'edit') {
      navigate(`/casos/${id}/editar`);
    } else if (pendingAction === 'delete') {
      setDeleteDialogOpen(true);
    } else if (pendingAction === 'process') {
      setProcessDialogOpen(true);
    } else if (pendingAction === 'status') {
      setStatusDialogOpen(true);
    }
    setPendingAction(null);
  };

  const confirmDelete = async () => {
    try {
      await casesApi.delete(id);
      toast.success('Caso deletado com sucesso');
      navigate('/casos');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar caso');
    }
    setDeleteDialogOpen(false);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    if (status === 'processado') {
      setPendingAction('process');
      setPasswordDialogOpen(true);
    } else {
      setPendingAction('status');
      setPasswordDialogOpen(true);
    }
  };

  const submitProcess = async () => {
    if (!processData.tipo_sancao) {
      toast.error('Selecione o tipo de sanção');
      return;
    }
    setSubmitting(true);
    try {
      // Upload PDF if provided
      if (processPdfFile) {
        await casesApi.uploadDespacho(id, processPdfFile);
      }
      await casesApi.process(id, processData);
      toast.success('Caso processado com sucesso');
      setProcessDialogOpen(false);
      setProcessPdfFile(null);
      loadCase();
    } catch (error) {
      console.error('Process error:', error);
      toast.error('Erro ao processar caso');
    } finally {
      setSubmitting(false);
    }
  };

  const submitStatusChange = async () => {
    setSubmitting(true);
    try {
      let despachoUrl = null;
      if (despachoFile) {
        const result = await casesApi.uploadDespacho(id, despachoFile);
        despachoUrl = result.url;
      }
      await casesApi.updateStatus(id, selectedStatus, despachoUrl);
      toast.success('Status atualizado com sucesso');
      setStatusDialogOpen(false);
      setDespachoFile(null);
      loadCase();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </Layout>
    );
  }

  if (!caso) {
    return null;
  }

  return (
    <Layout 
      title={caso.numero}
      actions={
        <div className="flex items-center gap-2 no-print">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="rounded-none border-zinc-200"
            data-testid="print-btn"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {canEdit() && (
            <Button 
              variant="outline"
              onClick={handleEdit}
              className="rounded-none border-zinc-200"
              data-testid="edit-case-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {canDelete() && (
            <Button 
              variant="outline"
              onClick={handleDelete}
              className="rounded-none border-red-200 text-red-600 hover:bg-red-50"
              data-testid="delete-case-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6" data-testid="case-details-view">
        {/* Back link */}
        <Link 
          to="/casos" 
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 no-print"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </Link>

        {/* Print Header with Logo */}
        <div className="print-header text-center mb-8 pb-4 border-b-2 border-zinc-900">
          <div className="flex justify-center mb-4">
            <img 
              src="/ffdtl-logo.png" 
              alt="F-FDTL Logo" 
              className="h-20 w-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wide">FALINTIL - Força de Defesa de Timor-Leste</h1>
          <h2 className="text-base font-semibold mt-1">Direção Justiça e Disciplina</h2>
          <div className="mt-4 pt-4 border-t border-zinc-300">
            <p className="text-lg font-bold">FICHA DE CASO DISCIPLINAR</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-zinc-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <StatusBadge status={caso.status} />
              <span className="text-mono-label text-xs text-zinc-500">
                Registrado em {caso.data_registo} às {caso.hora}
              </span>
            </div>
            
            {canEdit() && caso.status !== 'processado' && caso.status !== 'anulado' && (
              <div className="flex items-center gap-2 no-print">
                <span className="text-sm text-zinc-500">Alterar Status:</span>
                {caso.status !== 'em_processo' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('em_processo')}
                    className="rounded-none"
                    data-testid="status-em-processo-btn"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Em Processo
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('processado')}
                  className="rounded-none"
                  data-testid="status-processado-btn"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Processar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('arquivado')}
                  className="rounded-none"
                  data-testid="status-arquivado-btn"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Arquivar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('anulado')}
                  className="rounded-none text-red-600"
                  data-testid="status-anulado-btn"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Anular
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Person Info */}
          <div className="lg:col-span-2 bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Membro</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                {caso.foto_membro_url ? (
                  <img 
                    src={filesApi.getUrl(caso.foto_membro_url)}
                    alt={caso.refere_ao}
                    className="w-32 h-40 object-cover bg-zinc-100"
                  />
                ) : (
                  <div className="w-32 h-40 bg-zinc-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-zinc-300" />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">Nome</p>
                    <p className="font-semibold text-zinc-900">{caso.refere_ao}</p>
                  </div>
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">NIM</p>
                    <p className="font-mono text-zinc-900">{caso.nim || '-'}</p>
                  </div>
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">Posto</p>
                    <p className="text-zinc-900">{caso.posto}</p>
                  </div>
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">Sexo</p>
                    <p className="text-zinc-900">{caso.sexo === 'M' ? 'Masculino' : caso.sexo === 'F' ? 'Feminino' : '-'}</p>
                  </div>
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">Unidade</p>
                    <p className="text-zinc-900">{caso.componente_unidade}</p>
                  </div>
                  <div>
                    <p className="text-mono-label text-xs text-zinc-500">Telefone</p>
                    <p className="font-mono text-zinc-900">{caso.telefone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Info */}
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Caso</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Número</p>
                <p className="font-mono font-semibold text-zinc-900">{caso.numero}</p>
              </div>
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Tipo de Caso</p>
                <p className="text-zinc-900">{caso.tipo_caso}</p>
              </div>
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Requerente</p>
                <p className="text-zinc-900">{caso.requerente}</p>
              </div>
              {caso.telefone_requerente && (
                <div>
                  <p className="text-mono-label text-xs text-zinc-500">Telefone Requerente</p>
                  <p className="font-mono text-zinc-900">{caso.telefone_requerente}</p>
                </div>
              )}
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Registrado por</p>
                <p className="text-zinc-900">{caso.registrado_por}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sanction Info (if processed) */}
        {caso.status === 'processado' && caso.tipo_sancao && (
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Processamento</h3>
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Tipo de Sanção</p>
                <p className="font-semibold text-zinc-900">{caso.tipo_sancao}</p>
              </div>
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Data Despacho</p>
                <p className="font-mono text-zinc-900">{caso.data_despacho || '-'}</p>
              </div>
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Data Início</p>
                <p className="font-mono text-zinc-900">{caso.data_inicio || '-'}</p>
              </div>
              <div>
                <p className="text-mono-label text-xs text-zinc-500">Data Fim</p>
                <p className="font-mono text-zinc-900">{caso.data_fim || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-mono-label text-xs text-zinc-500">Oficial Instrutor</p>
                <p className="text-zinc-900">{caso.oficial_instrutor || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-mono-label text-xs text-zinc-500">Observação</p>
                <p className="text-zinc-900">{caso.observacao || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Attachments */}
        {(caso.anexo_pdf_url || caso.despacho_url) && (
          <div className="bg-white border border-zinc-200 no-print">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Anexos</h3>
            </div>
            <div className="p-6 flex flex-wrap gap-4">
              {caso.anexo_pdf_url && (
                <a 
                  href={filesApi.getUrl(caso.anexo_pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Anexo PDF</span>
                  <Download className="w-4 h-4 text-zinc-400" />
                </a>
              )}
              {caso.despacho_url && (
                <a 
                  href={filesApi.getUrl(caso.despacho_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Despacho</span>
                  <Download className="w-4 h-4 text-zinc-400" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={onPasswordConfirm}
        title="Autenticação Necessária"
        description="Digite sua senha para continuar com esta operação."
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o caso {caso.numero}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-none bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Processar Caso</DialogTitle>
            <DialogDescription>
              Preencha os dados do processamento do caso {caso.numero}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Sanção *</Label>
              <Select 
                value={processData.tipo_sancao} 
                onValueChange={(v) => setProcessData(p => ({...p, tipo_sancao: v}))}
              >
                <SelectTrigger className="rounded-none" data-testid="sancao-select">
                  <SelectValue placeholder="Selecione a sanção" />
                </SelectTrigger>
                <SelectContent>
                  {sancoes.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Despacho</Label>
                <Input
                  type="date"
                  value={processData.data_despacho}
                  onChange={(e) => setProcessData(p => ({...p, data_despacho: e.target.value}))}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={processData.data_inicio}
                  onChange={(e) => setProcessData(p => ({...p, data_inicio: e.target.value}))}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={processData.data_fim}
                onChange={(e) => setProcessData(p => ({...p, data_fim: e.target.value}))}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Oficial Instrutor</Label>
              <Input
                value={processData.oficial_instrutor}
                onChange={(e) => setProcessData(p => ({...p, oficial_instrutor: e.target.value}))}
                placeholder="Nome do oficial instrutor"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={processData.observacao}
                onChange={(e) => setProcessData(p => ({...p, observacao: e.target.value}))}
                placeholder="Observações sobre o caso"
                className="rounded-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Anexar Documento (PDF)</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setProcessPdfFile(e.target.files[0])}
                className="rounded-none"
              />
              <p className="text-xs text-zinc-500">Anexe o despacho ou documento relacionado (opcional)</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setProcessDialogOpen(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={submitProcess}
              disabled={submitting}
              className="rounded-none bg-zinc-900"
              data-testid="submit-process-btn"
            >
              {submitting ? 'Processando...' : 'Processar Caso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Alterar status do caso {caso.numero} para {selectedStatus?.replace('_', ' ')}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {(selectedStatus === 'arquivado' || selectedStatus === 'pendente') && (
              <div className="space-y-2">
                <Label>Despacho (PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setDespachoFile(e.target.files[0])}
                  className="rounded-none"
                />
                <p className="text-xs text-zinc-500">Anexe o despacho relacionado (opcional)</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialogOpen(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={submitStatusChange}
              disabled={submitting}
              className="rounded-none bg-zinc-900"
              data-testid="submit-status-btn"
            >
              {submitting ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
