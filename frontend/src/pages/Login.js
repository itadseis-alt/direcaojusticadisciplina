import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('https://images.pexels.com/photos/29770731/pexels-photo-29770731.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1024&w=1024')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      data-testid="login-page-container"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white border border-zinc-200 p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
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

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-mono-label text-zinc-400 text-[10px]">
              Sistema de Gestão Disciplinar
            </p>
            <p className="text-mono-label text-zinc-400 text-[10px] mt-1">
              Força de Defesa de Timor-Leste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
