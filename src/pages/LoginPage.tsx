import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Delete, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSupabaseConfig } from '../lib/supabase';

const CORRECT_PIN = '1621';

export const LoginPage: React.FC = () => {
  const { signInWithDemo, signInWithPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'PIN' | 'PASSWORD'>('PIN');

  // Password mode states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccessfulLogin = useCallback(() => {
    signInWithDemo();
    addToast('Welcome back, Aryan Sir.', 'success');
    navigate('/dashboard');
  }, [signInWithDemo, addToast, navigate]);

  const handleKeyPress = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Listen for digit entries when 4 digits reached
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setTimeout(() => {
          handleSuccessfulLogin();
        }, 150);
      } else {
        setShake(true);
        addToast('Incorrect PIN. Please try again.', 'error');
        const timer = setTimeout(() => {
          setShake(false);
          setPin('');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, handleSuccessfulLogin, addToast]);

  // Physical keyboard listener
  useEffect(() => {
    if (authMode !== 'PIN') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authMode, handleKeyPress, handleDelete]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  const keypadDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EEF0FF] text-[#5B5CE2] font-extrabold text-2xl mb-4 border border-[#5B5CE2]/20 shadow-xs">
          W
        </div>
        <h1 className="text-2xl font-extrabold tracking-widest text-[#171A21]">
          WEBRAJYA
        </h1>
        <p className="text-xs text-[#5B5CE2] font-bold tracking-widest uppercase mt-1">
          Aryan Rajput Control Center
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-[#E7E9EE] py-8 px-6 shadow-sm rounded-3xl sm:px-10">
          {authMode === 'PIN' ? (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-base font-bold text-[#171A21] flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-[#5B5CE2]" />
                  <span>Enter Security PIN</span>
                </h2>
                <p className="text-xs text-[#687080] mt-1">
                  Use your 4-digit PIN to access WebRajya
                </p>
              </div>

              {/* 4 PIN Dots Indicator */}
              <div
                className={`flex justify-center items-center gap-4 py-3 ${
                  shake ? 'animate-bounce text-red-500' : ''
                }`}
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-[#5B5CE2] scale-110 shadow-sm'
                          : 'bg-[#E7E9EE] border border-[#CBD0DD]'
                      }`}
                    />
                  );
                })}
              </div>

              {/* On-Screen Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
                {keypadDigits.map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    className="h-14 rounded-2xl bg-[#F7F8FA] hover:bg-[#EEF0FF] active:scale-95 border border-[#E7E9EE] text-[#171A21] font-bold text-xl flex items-center justify-center transition-all shadow-2xs hover:text-[#5B5CE2] hover:border-[#5B5CE2]/30"
                  >
                    {digit}
                  </button>
                ))}

                {/* Empty spot / Quick demo trigger */}
                <button
                  type="button"
                  onClick={handleSuccessfulLogin}
                  className="h-14 rounded-2xl bg-[#F7F8FA] hover:bg-[#EEF0FF] active:scale-95 border border-[#E7E9EE] text-[#687080] hover:text-[#5B5CE2] flex items-center justify-center transition-all"
                  title="Quick Demo Pass"
                >
                  <ShieldCheck className="w-5 h-5 text-[#5B5CE2]" />
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-14 rounded-2xl bg-[#F7F8FA] hover:bg-[#EEF0FF] active:scale-95 border border-[#E7E9EE] text-[#171A21] font-bold text-xl flex items-center justify-center transition-all shadow-2xs hover:text-[#5B5CE2] hover:border-[#5B5CE2]/30"
                >
                  0
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-14 rounded-2xl bg-[#F7F8FA] hover:bg-red-50 active:scale-95 border border-[#E7E9EE] text-[#687080] hover:text-red-500 flex items-center justify-center transition-all"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Switch to Password login link */}
              <div className="pt-2 border-t border-[#F0F2F6]">
                <button
                  type="button"
                  onClick={() => setAuthMode('PASSWORD')}
                  className="text-xs font-semibold text-[#5B5CE2] hover:underline inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Switch to Email & Password</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-base font-bold text-[#171A21] flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-[#5B5CE2]" />
                  <span>Owner Sign In</span>
                </h2>
                <p className="text-xs text-[#687080] mt-1">
                  Enter your WebRajya credentials below
                </p>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

              {/* Switch back to PIN */}
              <div className="pt-2 text-center border-t border-[#F0F2F6]">
                <button
                  type="button"
                  onClick={() => setAuthMode('PIN')}
                  className="text-xs font-semibold text-[#5B5CE2] hover:underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Use 4-Digit PIN Lock Screen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-[#9AA2B1] font-mono">
          WEBRAJYA • PRIVATE PERSONAL APP FOR ARYAN RAJPUT
        </div>
      </div>
    </div>
  );
};
