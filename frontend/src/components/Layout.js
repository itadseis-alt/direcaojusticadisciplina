import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Activity, 
  User, 
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'pessoal_justica', 'pessoal_superior'] },
  { path: '/casos', label: 'Casos', icon: FileText, roles: ['super_admin', 'admin', 'pessoal_justica', 'pessoal_superior'] },
  { path: '/usuarios', label: 'Usuários', icon: Users, roles: ['super_admin', 'admin'] },
  { path: '/logs', label: 'Logs', icon: Activity, roles: ['super_admin'] },
];

function Sidebar({ mobile = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canEdit } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.tipo));

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-200">
        <h1 className="text-lg font-black tracking-tight text-zinc-900">FALINTIL-FDTL</h1>
        <p className="text-mono-label text-zinc-500 mt-1">Direção Justiça e Disciplina</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick Action */}
      {canEdit() && (
        <div className="p-4 border-t border-zinc-200">
          <Link to="/casos/novo" onClick={onClose}>
            <Button className="w-full bg-zinc-900 text-white rounded-none hover:bg-zinc-800" data-testid="new-case-sidebar-btn">
              <Plus className="w-4 h-4 mr-2" />
              Novo Caso
            </Button>
          </Link>
        </div>
      )}

      {/* User Info */}
      <div className="p-4 border-t border-zinc-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-200 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{user?.nome}</p>
            <p className="text-mono-label text-zinc-500 text-[10px]">{user?.tipo?.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/perfil" onClick={onClose} className="flex-1">
            <Button variant="outline" size="sm" className="w-full rounded-none border-zinc-200" data-testid="profile-btn">
              Perfil
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="rounded-none border-zinc-200"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return <NavContent />;
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-zinc-200 h-screen sticky top-0">
      <NavContent />
    </aside>
  );
}

export function Layout({ children, title, actions }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar mobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden rounded-none"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
