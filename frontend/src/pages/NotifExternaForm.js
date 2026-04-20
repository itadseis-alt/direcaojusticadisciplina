import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { notifExternaApi, filesApi } from '@/lib/api';
import { ArrowLeft, Save, Upload, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { PasswordDialog } from '@/components/PasswordDialog';

const postosGroups = {
  'Oficiais Generais': ['General', 'Almirante', 'Tenente General', 'Vice Almirante', 'Major General', 'Contra Almirante', 'Brigadeiro General', 'Comodoro'],
  'Oficiais Superiores': ['Coronel', 'Capitão-de-mar-e-guerra', 'Tenente-Coronel', 'Capitão de Fragata', 'Major', 'Capitão Tenente'],
  'Oficiais Capitães e Subalternos': ['Capitão', 'Primeiro Tenente', 'Tenente', 'Segundo Tenente', 'Alferes', 'Subtenente'],
  'Sargentos': ['Sargento Mor', 'Sargento Chefe', 'Sargento Ajudante', 'Primeiro Sargento', 'Segundo Sargento'],
  'Praças': ['Cabo Secção', 'Cabo', 'Cabo Adjunto', 'Primeiro Marinheiro', 'Segundo Cabo', 'Primeiro Grumete', 'Soldado']
};

const unidades = [
  'Unidade Apoio Quartel General', 'Quartel General', 'Componente Força Terrestre (CFT)',
  'Componente Força Naval (CFN)', 'Componente Aérea Ligeira (CAL)', 'Força Apoio Geral (FAG)',
  'Unidade Apoio Serviço (UAS)', 'Centro de Instrução do Comandante Nicolau Lobato (CICNL)',
  'Unidade de Policia Militar (PM)', 'Unidade FALINTIL (UF)',
  '1º Batalhão da CFT', '2º Batalhão da CFT',
  'Companhia de Engenharia', 'Companhia de Transmissões', 'Corpo Fuzileiros'
];

const qualidades = ['Suspeito', 'Arguido', 'Testemunha'];

export default function NotifExternaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [despachoFile, setDespachoFile] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [form, setForm] = useState({
    data_entrada: '', nim: '', nome_completo: '', sexo: '', posto: '',
    componente_unidade: '', qualidade: '', tipo_caso: '', nu_nuc: '',
    data_apresenta: '', horas: '', observacao: '', telefone: ''
  });
  const [existingDespacho, setExistingDespacho] = useState(null);
  const [existingFoto, setExistingFoto] = useState(null);

  useEffect(() => {
    if (isEditing) loadNotif();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotif = async () => {
    setLoading(true);
    try {
      const data = await notifExternaApi.get(id);
      setForm({
        data_entrada: data.data_entrada || '',
        nim: data.nim || '',
        nome_completo: data.nome_completo || '',
        sexo: data.sexo || '',
        posto: data.posto || '',
        componente_unidade: data.componente_unidade || '',
        qualidade: data.qualidade || '',
        tipo_caso: data.tipo_caso || '',
        nu_nuc: data.nu_nuc || '',
        data_apresenta: data.data_apresenta || '',
        horas: data.horas || '',
        observacao: data.observacao || '',
        telefone: data.telefone || ''
      });
      setExistingDespacho(data.despacho_url);
      setExistingFoto(data.foto_url);
    } catch (error) {
      toast.error('Erro ao carregar notificação');
      navigate('/notificacoes-externas');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nome_completo || !form.nim) {
      toast.error('Nome e NIM são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      let notifId = id;
      if (isEditing) {
        await notifExternaApi.update(id, form);
      } else {
        const result = await notifExternaApi.create(form);
        notifId = result.id;
      }

      // Upload files
      if (despachoFile && notifId) {
        await notifExternaApi.uploadDespacho(notifId, despachoFile);
      }
      if (fotoFile && notifId) {
        await notifExternaApi.uploadFoto(notifId, fotoFile);
      }

      toast.success(isEditing ? 'Notificação atualizada' : 'Notificação registrada');
      navigate(`/notificacoes-externas/${notifId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    handleSubmit();
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><Loader className="w-6 h-6 animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/notificacoes-externas')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>

        <h1 className="text-2xl font-black tracking-tight" data-testid="ne-form-title">
          {isEditing ? 'Editar Notificação Externa' : 'Nova Notificação Externa'}
        </h1>

        <div className="bg-white border border-zinc-200 p-6 space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data Entrada</Label>
              <Input type="date" value={form.data_entrada} onChange={(e) => handleChange('data_entrada', e.target.value)}
                className="rounded-none" data-testid="ne-data-entrada" />
            </div>
            <div>
              <Label>NIM *</Label>
              <Input placeholder="Número Inteiro" value={form.nim} onChange={(e) => handleChange('nim', e.target.value)}
                className="rounded-none" data-testid="ne-nim" />
            </div>
            <div>
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(v) => handleChange('sexo', v)}>
                <SelectTrigger className="rounded-none" data-testid="ne-sexo"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <Label>Nome Completo *</Label>
            <Input placeholder="Nome completo (sem números)" value={form.nome_completo}
              onChange={(e) => handleChange('nome_completo', e.target.value.replace(/[0-9]/g, ''))}
              className="rounded-none" data-testid="ne-nome" />
          </div>

          {/* Telefone */}
          <div>
            <Label>Telefone</Label>
            <Input placeholder="77000000" value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              className="rounded-none font-mono" data-testid="ne-telefone" />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Posto</Label>
              <Select value={form.posto} onValueChange={(v) => handleChange('posto', v)}>
                <SelectTrigger className="rounded-none" data-testid="ne-posto"><SelectValue placeholder="Selecione o posto" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(postosGroups).map(([group, postos]) => (
                    <SelectGroup key={group}>
                      <SelectLabel className="text-xs font-semibold text-zinc-500">{group}</SelectLabel>
                      {postos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Componente/Unidade</Label>
              <Select value={form.componente_unidade} onValueChange={(v) => handleChange('componente_unidade', v)}>
                <SelectTrigger className="rounded-none" data-testid="ne-unidade"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Qualidade</Label>
              <Select value={form.qualidade} onValueChange={(v) => handleChange('qualidade', v)}>
                <SelectTrigger className="rounded-none" data-testid="ne-qualidade"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {qualidades.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo Caso</Label>
              <Input placeholder="Texto livre" value={form.tipo_caso} onChange={(e) => handleChange('tipo_caso', e.target.value)}
                className="rounded-none" data-testid="ne-tipo-caso" />
            </div>
            <div>
              <Label>Nu. Nuc</Label>
              <Input placeholder="Texto livre" value={form.nu_nuc} onChange={(e) => handleChange('nu_nuc', e.target.value)}
                className="rounded-none" data-testid="ne-nu-nuc" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data Apresentação</Label>
              <Input type="date" value={form.data_apresenta} onChange={(e) => handleChange('data_apresenta', e.target.value)}
                className="rounded-none" data-testid="ne-data-apresenta" />
            </div>
            <div>
              <Label>Horas</Label>
              <Input type="time" value={form.horas} onChange={(e) => handleChange('horas', e.target.value)}
                className="rounded-none" data-testid="ne-horas" />
            </div>
          </div>

          {/* Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Despacho (PDF)</Label>
              {existingDespacho && (
                <a href={filesApi.getUrl(existingDespacho)} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline block mb-1">Ver despacho atual</a>
              )}
              <Input type="file" accept=".pdf" onChange={(e) => setDespachoFile(e.target.files[0])}
                className="rounded-none" data-testid="ne-despacho-file" />
            </div>
            <div>
              <Label>Foto Perfil</Label>
              {existingFoto && (
                <img src={filesApi.getUrl(existingFoto)} alt="Foto" className="w-16 h-16 object-cover border mb-1" />
              )}
              <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setFotoFile(e.target.files[0])}
                className="rounded-none" data-testid="ne-foto-file" />
            </div>
          </div>

          {/* Observação */}
          <div>
            <Label>Observação</Label>
            <Textarea placeholder="Observações adicionais..." value={form.observacao}
              onChange={(e) => handleChange('observacao', e.target.value)} className="rounded-none min-h-[80px]"
              data-testid="ne-observacao" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" className="rounded-none" onClick={() => navigate('/notificacoes-externas')}>Cancelar</Button>
            {isEditing ? (
              <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" onClick={() => setShowPassword(true)}
                disabled={saving} data-testid="ne-save-btn">
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            ) : (
              <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" onClick={handleCreate}
                disabled={saving} data-testid="ne-save-btn">
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Registrar Notificação
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPassword && (
        <PasswordDialog
          open={showPassword}
          onOpenChange={setShowPassword}
          onConfirm={handleSubmit}
          title="Confirmar Edição"
          description="Digite sua senha para confirmar as alterações."
        />
      )}
    </Layout>
  );
}
