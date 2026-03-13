import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Aurora } from '../components/Aurora';
import { LogIn, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login error. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Aurora colorStops={["#9a0e15", "#550202", "#ea8080"]} amplitude={0.8} blend={0.15} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-2xl z-10 relative"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20 mb-4 overflow-hidden p-2">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Stylized Logo Representation */}
              <div className="absolute w-12 h-12 bg-red-600 rounded-full opacity-80 mix-blend-multiply transform -translate-x-2"></div>
              <div className="absolute w-12 h-12 bg-zinc-900 rounded-full opacity-80 mix-blend-multiply transform translate-x-2"></div>
              <Shield className="text-white w-6 h-6 z-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-white text-center">VAST</h1>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] -mt-1">Maintenance Ltd.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Email</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-xs">
            © 2025 Vast Maintenance Limited.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
