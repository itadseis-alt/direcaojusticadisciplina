import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Loader, Eye, EyeOff } from 'lucide-react';
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

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: ''
  });

  // Determine available roles based on current user
  const availableRoles = currentUser?.tipo === 'super_admin' 
    ? [
        { value: 'admin', label: 'Admin' },
        { value: 'pessoal_justica', label: 'Pessoal Justiça' },
        { value: 'pessoal_superior', label: 'Pessoal Superior' }
      ]
    : [
        { value: 'pessoal_justica', label: 'Pessoal Justiça' },
        { value: 'pessoal_superior', label: 'Pessoal Superior' }
      ];

  useEffect(() => {
    if (isEditing) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const data = await usersApi.get(id);
      setFormData({
        nome: data.nome,
        email: data.email,
        senha: '',
        tipo: data.tipo
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Erro ao carregar usuário');
      navigate('/usuarios');
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
    if (!formData.nome || !formData.email || !formData.tipo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isEditing && !formData.senha) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    if (formData.senha && formData.senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await usersApi.update(id, {
          nome: formData.nome,
          email: formData.email,
          tipo: formData.tipo
        });
        
        // Update password separately if provided
        if (formData.senha) {
          await usersApi.updatePassword(id, formData.senha);
        }
        
        toast.success('Usuário atualizado com sucesso');
      } else {
        await usersApi.create(formData);
        toast.success('Usuário criado com sucesso');
      }
      navigate('/usuarios');
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.detail || (isEditing ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário');
      toast.error(message);
    } finally {
      setSubmitting(false);
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
    <Layout title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}>
      <div className="max-w-xl" data-testid="user-form">
        {/* Back link */}
        <Link 
          to="/usuarios"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-zinc-200">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-mono-label text-xs text-zinc-500">Dados do Usuário</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-none"
                  required
                  data-testid="user-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@falintil.tl"
                  className="rounded-none"
                  required
                  data-testid="user-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label>{isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="rounded-none pr-10"
                    data-testid="user-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Usuário *</Label>
                <Select value={formData.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                  <SelectTrigger className="rounded-none" data-testid="user-type-select">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                  {currentUser?.tipo === 'super_admin' 
                    ? 'Super Admin pode criar Admin, Pessoal Justiça e Pessoal Superior'
                    : 'Admin pode criar Pessoal Justiça e Pessoal Superior'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link to="/usuarios">
              <Button type="button" variant="outline" className="rounded-none">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={submitting}
              className="rounded-none bg-zinc-900 hover:bg-zinc-800"
              data-testid="save-user-btn"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
