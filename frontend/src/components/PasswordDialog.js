import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

export function PasswordDialog({ open, onOpenChange, onConfirm, title, description }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyPassword(password);
    
    if (result.success) {
      setPassword('');
      onConfirm();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-none border-zinc-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title || 'Confirmar Senha'}
          </DialogTitle>
          <DialogDescription>
            {description || 'Digite sua senha para confirmar esta ação.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="rounded-none"
                autoFocus
                data-testid="password-confirm-input"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-600" data-testid="password-error">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !password}
              className="rounded-none bg-zinc-900"
              data-testid="password-confirm-btn"
            >
              {loading ? 'Verificando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
