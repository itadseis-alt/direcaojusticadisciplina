import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader, User, Eye, EyeOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const roleLabels = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  pessoal_justica: 'Pessoal Justiça',
  pessoal_superior: 'Pessoal Superior'
};

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Digite a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.updatePassword(user.id, newPassword);
      toast.success('Senha alterada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5MB)');
      return;
    }

    setUploadingPhoto(true);
    try {
      await usersApi.uploadPhoto(user.id, file);
      toast.success('Foto atualizada com sucesso');
      checkAuth(); // Refresh user data
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Layout title="Meu Perfil">
      <div className="max-w-xl space-y-6" data-testid="profile-view">
        {/* Profile Info */}
        <div className="bg-white border border-zinc-200">
          <div className="p-4 border-b border-zinc-200">
            <h3 className="text-mono-label text-xs text-zinc-500">Informações do Perfil</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Photo */}
              <div className="relative">
                <div className="w-24 h-24 bg-zinc-100 flex items-center justify-center">
                  {user?.foto_url ? (
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${user.foto_url}`}
                      alt={user.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-zinc-300" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 text-white cursor-pointer hover:bg-zinc-800 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-mono-label text-xs text-zinc-500">Nome</p>
                  <p className="font-semibold text-zinc-900">{user?.nome}</p>
                </div>
                <div>
                  <p className="text-mono-label text-xs text-zinc-500">Email</p>
                  <p className="text-zinc-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-mono-label text-xs text-zinc-500">Tipo de Usuário</p>
                  <p className="text-zinc-900">{roleLabels[user?.tipo] || user?.tipo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-zinc-200">
          <div className="p-4 border-b border-zinc-200">
            <h3 className="text-mono-label text-xs text-zinc-500">Alterar Senha</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="rounded-none pr-10"
                  data-testid="new-password-input"
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
              <Label>Confirmar Nova Senha</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                className="rounded-none"
                data-testid="confirm-password-input"
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="rounded-none bg-zinc-900 hover:bg-zinc-800"
              data-testid="change-password-btn"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Permissions Info */}
        <div className="bg-zinc-50 border border-zinc-200 p-4">
          <h4 className="font-semibold text-zinc-900 mb-2">Suas Permissões</h4>
          <ul className="text-sm text-zinc-600 space-y-1">
            {user?.tipo === 'super_admin' && (
              <>
                <li>• Acesso total ao sistema</li>
                <li>• Criar, editar e deletar usuários</li>
                <li>• Criar, editar e deletar casos</li>
                <li>• Visualizar logs de atividade</li>
                <li>• Exportar dados</li>
              </>
            )}
            {user?.tipo === 'admin' && (
              <>
                <li>• Criar e editar usuários (Pessoal Justiça e Superior)</li>
                <li>• Criar e editar casos</li>
                <li>• Exportar dados</li>
              </>
            )}
            {user?.tipo === 'pessoal_justica' && (
              <>
                <li>• Criar e editar casos</li>
                <li>• Alterar status de casos</li>
              </>
            )}
            {user?.tipo === 'pessoal_superior' && (
              <>
                <li>• Visualizar casos (somente leitura)</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
