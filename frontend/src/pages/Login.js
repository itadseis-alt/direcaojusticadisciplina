import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}
      data-testid="login-page-container"
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-200 p-8 shadow-lg">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <img 
                src="/ffdtl-logo.png" 
                alt="F-FDTL Logo" 
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-1">
                FALINTIL-FDTL
              </h1>
              <p className="text-mono-label text-zinc-500 text-xs">
                Direção Justiça e Disciplina
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-mono-label text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@falintil.tl"
                  className="rounded-none border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  required
                  data-testid="login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-mono-label text-xs">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-none border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 pr-10"
                    required
                    data-testid="login-password-input"
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white rounded-none hover:bg-zinc-800 py-6"
                data-testid="login-submit-btn"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* System Info */}
            <div className="mt-6 pt-4 border-t border-zinc-200 text-center">
              <p className="text-mono-label text-zinc-400 text-[10px]">
                Sistema de Gestão Disciplinar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-white/70">
          F-FDTL: Divisão de Comunicações e Sistema de Informação @2026
        </p>
      </footer>
    </div>
  );
}
