import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'admin' | 'employee' }> = ({ 
  children, 
  allowedRole 
}) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} />} 
      />
      
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute allowedRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/" 
        element={<Navigate to={user ? (role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} 
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
