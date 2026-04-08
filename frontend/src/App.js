import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Cases from "@/pages/Cases";
import CaseForm from "@/pages/CaseForm";
import CaseDetail from "@/pages/CaseDetail";
import Users from "@/pages/Users";
import UserForm from "@/pages/UserForm";
import ActivityLogs from "@/pages/ActivityLogs";
import Profile from "@/pages/Profile";

// Protected Route Component
function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-mono-label text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.tipo)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Public Route (redirect if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-mono-label text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/casos" element={
        <ProtectedRoute>
          <Cases />
        </ProtectedRoute>
      } />
      
      <Route path="/casos/novo" element={
        <ProtectedRoute requiredRoles={['super_admin', 'admin', 'pessoal_justica']}>
          <CaseForm />
        </ProtectedRoute>
      } />
      
      <Route path="/casos/:id" element={
        <ProtectedRoute>
          <CaseDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/casos/:id/editar" element={
        <ProtectedRoute requiredRoles={['super_admin', 'admin', 'pessoal_justica']}>
          <CaseForm />
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios" element={
        <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
          <Users />
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios/novo" element={
        <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
          <UserForm />
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios/:id/editar" element={
        <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
          <UserForm />
        </ProtectedRoute>
      } />
      
      <Route path="/logs" element={
        <ProtectedRoute requiredRoles={['super_admin']}>
          <ActivityLogs />
        </ProtectedRoute>
      } />
      
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
