import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader,
  User,
  Shield,
  UserCheck,
  Eye
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
import { toast } from 'sonner';

const roleConfig = {
  super_admin: { label: 'Super Admin', icon: Shield, color: 'text-red-600' },
  admin: { label: 'Admin', icon: UserCheck, color: 'text-blue-600' },
  pessoal_justica: { label: 'Pessoal Justiça', icon: User, color: 'text-green-600' },
  pessoal_superior: { label: 'Pessoal Superior', icon: Eye, color: 'text-zinc-600' }
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { user: currentUser, canDelete } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await usersApi.delete(userToDelete.id);
      toast.success('Usuário deletado com sucesso');
      loadUsers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar usuário');
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <Layout 
      title="Usuários"
      actions={
        <Link to="/usuarios/novo">
          <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800" data-testid="new-user-btn">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </Link>
      }
    >
      <div className="space-y-6" data-testid="users-list-view">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>Permissões:</strong> Super Admin pode criar/editar/deletar todos os usuários. 
            Admin pode criar/editar Pessoal Justiça e Pessoal Superior.
          </p>
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
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Criado em</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const role = roleConfig[user.tipo] || roleConfig.pessoal_superior;
                    const Icon = role.icon;
                    const isCurrentUser = user.id === currentUser?.id;
                    const canEditUser = currentUser?.tipo === 'super_admin' || 
                      (currentUser?.tipo === 'admin' && !['super_admin', 'admin'].includes(user.tipo));
                    const canDeleteUser = canDelete() && !isCurrentUser;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">
                                {user.nome}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-zinc-500">(você)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-zinc-600">{user.email}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${role.color}`} />
                            <span className="text-sm">{role.label}</span>
                          </div>
                        </td>
                        <td className="font-mono text-sm text-zinc-500">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {canEditUser && (
                              <Link to={`/usuarios/${user.id}/editar`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="rounded-none"
                                  data-testid={`edit-user-${user.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            {canDeleteUser && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`delete-user-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-zinc-500 py-16">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {userToDelete?.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-none bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-user-btn"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
