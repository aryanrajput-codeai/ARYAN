import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSupabaseConfig } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const { signInWithDemo, signInWithPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickOwnerAccess = () => {
    signInWithDemo();
    addToast('Welcome back, Aryan Sir.', 'success');
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter your owner credentials', 'error');
      return;
    }

    setLoading(true);
    try {
      await signInWithPassword(email, password);
      addToast('Welcome back, Aryan Sir.', 'success');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EEF0FF] text-[#5B5CE2] font-bold text-2xl mb-4 border border-[#5B5CE2]/15 shadow-sm">
          W
        </div>
        <h1 className="text-2xl font-extrabold tracking-widest text-[#171A21]">
          WEBRAJYA
        </h1>
        <p className="text-xs text-[#5B5CE2] font-semibold tracking-wider uppercase mt-1">
          Aryan Rajput Control Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-[#E7E9EE] py-8 px-6 shadow-sm rounded-2xl sm:px-10 space-y-6">
          {/* Quick Access for Local Dev */}
          {!import.meta.env.PROD && !getSupabaseConfig().isConfigured && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleQuickOwnerAccess}
                className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl border border-[#5B5CE2]/20 bg-[#EEF0FF] hover:bg-[#E2E5FF] text-[#5B5CE2] transition-colors"
              >
                <ShieldCheck className="w-5 h-5 text-[#5B5CE2]" />
                <span className="text-xs font-bold">Quick Owner Access</span>
              </button>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#687080] uppercase tracking-wider mb-1">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9AA2B1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aryan@webrajya.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8FA] border border-[#E7E9EE] rounded-xl text-sm text-[#171A21] placeholder-[#9AA2B1] focus:outline-none focus:ring-2 focus:ring-[#5B5CE2] focus:border-[#5B5CE2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687080] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9AA2B1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8FA] border border-[#E7E9EE] rounded-xl text-sm text-[#171A21] placeholder-[#9AA2B1] focus:outline-none focus:ring-2 focus:ring-[#5B5CE2] focus:border-[#5B5CE2]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#5B5CE2] hover:bg-[#4B4CBF] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Enter WebRajya'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-[#9AA2B1] font-mono">
          WEBRAJYA • PRIVATE PERSONAL APP FOR ARYAN RAJPUT
        </div>
      </div>
    </div>
  );
};
