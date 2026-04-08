import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { casesApi } from '@/lib/api';
import { ArrowLeft, Save, Upload, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const postosGroups = {
  'Oficiais Generais': [
    'General', 'Almirante', 'Tenente General', 'Vice Almirante', 
    'Major General', 'Contra Almirante', 'Brigadeiro General', 'Comodoro'
  ],
  'Oficiais Superiores': [
    'Coronel', 'Capitão-de-mar-e-guerra', 'Tenente-Coronel', 
    'Capitão de Fragata', 'Major', 'Capitão Tenente'
  ],
  'Oficiais Capitães e Subalternos': [
    'Capitão', 'Primeiro Tenente', 'Tenente', 'Segundo Tenente', 'Alferes', 'Subtenente'
  ],
  'Sargentos': [
    'Sargento Mor', 'Sargento Chefe', 'Sargento Ajudante', 'Primeiro Sargento', 'Segundo Sargento'
  ],
  'Praças': [
    'Cabo Secção', 'Cabo', 'Cabo Adjunto', 'Primeiro Marinheiro', 
    'Segundo Cabo', 'Primeiro Grumete', 'Soldado'
  ]
};

const unidades = [
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

const tiposCaso = [
  'Indisciplina',
  'Ausência sem licença',
  'Insubordinação',
  'Má conduta',
  'Negligência',
  'Desacato',
  'Embriaguez',
  'Abandono de posto',
  'Desobediência',
  'Outro'
];

export default function CaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [formData, setFormData] = useState({
    data_registo: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipo_caso: '',
    refere_ao: '',
    posto: '',
    componente_unidade: '',
    requerente: '',
    telefone: '',
    nim: '',
    sexo: ''
  });

  const [caseId, setCaseId] = useState(id);

  useEffect(() => {
    if (isEditing) {
      loadCase();
    }
  }, [id]);

  const loadCase = async () => {
    try {
      const data = await casesApi.get(id);
      setFormData({
        data_registo: data.data_registo,
        hora: data.hora,
        tipo_caso: data.tipo_caso,
        refere_ao: data.refere_ao,
        posto: data.posto,
        componente_unidade: data.componente_unidade,
        requerente: data.requerente,
        telefone_requerente: data.telefone_requerente || '',
        telefone: data.telefone || '',
        nim: data.nim || '',
        sexo: data.sexo || ''
      });
    } catch (error) {
      console.error('Error loading case:', error);
      toast.error('Erro ao carregar caso');
      navigate('/casos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.refere_ao || !formData.tipo_caso || !formData.posto || !formData.componente_unidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await casesApi.update(id, formData);
        toast.success('Caso atualizado com sucesso');
        navigate(`/casos/${id}`);
      } else {
        const newCase = await casesApi.create(formData);
        setCaseId(newCase.id);
        toast.success('Caso criado com sucesso');
        navigate(`/casos/${newCase.id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEditing ? 'Erro ao atualizar caso' : 'Erro ao criar caso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5MB)');
      return;
    }

    if (!caseId) {
      toast.error('Salve o caso primeiro para anexar foto');
      return;
    }

    setUploadingFoto(true);
    try {
      await casesApi.uploadFoto(caseId, file);
      toast.success('Foto enviada com sucesso');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 20MB)');
      return;
    }

    if (!caseId) {
      toast.error('Salve o caso primeiro para anexar PDF');
      return;
    }

    setUploadingPdf(true);
    try {
      await casesApi.uploadPdf(caseId, file);
      toast.success('PDF enviado com sucesso');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar PDF');
    } finally {
      setUploadingPdf(false);
    }
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

  return (
    <Layout title={isEditing ? 'Editar Caso' : 'Novo Caso'}>
      <div className="max-w-4xl" data-testid="case-registration-form">
        {/* Back link */}
        <Link 
          to={isEditing ? `/casos/${id}` : '/casos'}
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEditing ? 'Voltar para detalhes' : 'Voltar para lista'}
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data e Hora */}
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Data e Hora do Registro</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Data do Registro *</Label>
                <Input
                  type="date"
                  value={formData.data_registo}
                  onChange={(e) => handleChange('data_registo', e.target.value)}
                  className="rounded-none"
                  required
                  data-testid="case-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleChange('hora', e.target.value)}
                  className="rounded-none"
                  required
                  data-testid="case-time-input"
                />
              </div>
            </div>
          </div>

          {/* Dados do Membro */}
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Membro</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label>Nome Completo (Refere ao) *</Label>
                <Input
                  value={formData.refere_ao}
                  onChange={(e) => handleChange('refere_ao', e.target.value)}
                  placeholder="Nome completo do membro"
                  className="rounded-none"
                  required
                  data-testid="case-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>NIM</Label>
                <Input
                  value={formData.nim}
                  onChange={(e) => handleChange('nim', e.target.value)}
                  placeholder="F00000"
                  className="rounded-none font-mono"
                  data-testid="case-nim-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Posto *</Label>
                <Select value={formData.posto} onValueChange={(v) => handleChange('posto', v)}>
                  <SelectTrigger className="rounded-none" data-testid="case-posto-select">
                    <SelectValue placeholder="Selecione o posto" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(postosGroups).map(([group, postos]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 bg-zinc-50">{group}</div>
                        {postos.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Componente/Unidade *</Label>
                <Select value={formData.componente_unidade} onValueChange={(v) => handleChange('componente_unidade', v)}>
                  <SelectTrigger className="rounded-none" data-testid="case-unidade-select">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={formData.sexo} onValueChange={(v) => handleChange('sexo', v)}>
                  <SelectTrigger className="rounded-none" data-testid="case-sexo-select">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="77000000"
                  className="rounded-none font-mono"
                  data-testid="case-phone-input"
                />
              </div>
            </div>
          </div>

          {/* Dados do Caso */}
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Caso</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Caso *</Label>
                <Select value={formData.tipo_caso} onValueChange={(v) => handleChange('tipo_caso', v)}>
                  <SelectTrigger className="rounded-none" data-testid="case-tipo-select">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCaso.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Requerente *</Label>
                <Input
                  value={formData.requerente}
                  onChange={(e) => handleChange('requerente', e.target.value)}
                  placeholder="Quem solicitou o registro"
                  className="rounded-none"
                  required
                  data-testid="case-requerente-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone do Requerente</Label>
                <Input
                  value={formData.telefone_requerente}
                  onChange={(e) => handleChange('telefone_requerente', e.target.value)}
                  placeholder="77000000"
                  className="rounded-none font-mono"
                  data-testid="case-telefone-requerente-input"
                />
              </div>
            </div>
          </div>

          {/* Anexos (only show after case is created) */}
          {caseId && (
            <div className="bg-white border border-zinc-200">
              <div className="p-4 border-b border-zinc-200">
                <h3 className="text-mono-label text-xs text-zinc-500">Anexos</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Foto do Membro (JPG/PNG, máx 5MB)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFotoUpload}
                      className="rounded-none"
                      disabled={uploadingFoto}
                    />
                    {uploadingFoto && <Loader className="w-4 h-4 animate-spin" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anexo PDF (máx 20MB)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="rounded-none"
                      disabled={uploadingPdf}
                    />
                    {uploadingPdf && <Loader className="w-4 h-4 animate-spin" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link to={isEditing ? `/casos/${id}` : '/casos'}>
              <Button type="button" variant="outline" className="rounded-none">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={submitting}
              className="rounded-none bg-zinc-900 hover:bg-zinc-800"
              data-testid="save-case-btn"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Registrar Caso'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
