import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, JWTPayload, UserRole } from '../types';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  employeeId: string | null;
  role: UserRole | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (token: string) => {
    localStorage.setItem('vast_maintenance_token', token);
    const decoded = jwtDecode<JWTPayload>(token);
    setRole(decoded.role);
    setEmployeeId(decoded.employeeId || null);
    // In a real app, we might fetch the full user object here
    setUser({ id: decoded.userId, role: decoded.role, name: '', email: '', created_at: '' });
    initiateSocketConnection(token);
  };

  const logout = () => {
    localStorage.removeItem('vast_maintenance_token');
    setUser(null);
    setRole(null);
    setEmployeeId(null);
    disconnectSocket();
  };

  useEffect(() => {
    const token = localStorage.getItem('vast_maintenance_token');
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setRole(decoded.role);
          setEmployeeId(decoded.employeeId || null);
          setUser({ id: decoded.userId, role: decoded.role, name: '', email: '', created_at: '' });
          initiateSocketConnection(token);
        }
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, employeeId, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
