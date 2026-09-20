import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getSupabaseConfig } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithDemo: (role?: 'ADMIN' | 'STAFF') => void;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ARYAN_OWNER: UserProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'aryan@webrajya.com',
  full_name: 'Aryan Rajput',
  role: 'ADMIN',
  created_at: '2026-01-01T00:00:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const config = getSupabaseConfig();
    const isProd = import.meta.env.PROD;
    const saved = localStorage.getItem('webrajya_active_user');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If in production and saved user was a hardcoded demo user, clear it
        if (isProd && parsed.id === ARYAN_OWNER.id) {
          localStorage.removeItem('webrajya_active_user');
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    // Development default fallback mode
    if (!isProd && !config.isConfigured) {
      return ARYAN_OWNER;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const config = getSupabaseConfig();
      if (config.isConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile);
              localStorage.setItem('webrajya_active_user', JSON.stringify(profile));
            } else {
              const defaultProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || 'aryan@webrajya.com',
                full_name: 'Aryan Rajput',
                role: 'ADMIN',
                created_at: new Date().toISOString(),
              };
              setUser(defaultProfile);
            }
          }
        } catch (err) {
          console.warn('Supabase session load error:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const config = getSupabaseConfig();

    if (config.isConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const activeUser: UserProfile = profile || {
            id: data.user.id,
            email: data.user.email || email,
            full_name: 'Aryan Rajput',
            role: 'ADMIN',
            created_at: new Date().toISOString(),
          };

          setUser(activeUser);
          localStorage.setItem('webrajya_active_user', JSON.stringify(activeUser));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: unknown) {
        console.warn('Supabase Auth error:', err);
      }
    }

    const targetUser: UserProfile = ARYAN_OWNER;
    setUser(targetUser);
    localStorage.setItem('webrajya_active_user', JSON.stringify(targetUser));
    setIsLoading(false);
    return { success: true };
  };

  const signInWithPassword = async (email: string, password?: string) => {
    const res = await signIn(email, password);
    if (!res.success) {
      throw new Error(res.error || 'Authentication failed');
    }
    return res;
  };

  const signInWithDemo = () => {
    setUser(ARYAN_OWNER);
    localStorage.setItem('webrajya_active_user', JSON.stringify(ARYAN_OWNER));
  };

  const signOut = async () => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('webrajya_active_user');
  };

  const switchRole = (newRole: UserRole) => {
    const config = getSupabaseConfig();
    if (import.meta.env.PROD || config.isConfigured) {
      console.warn('Role switching is disabled in production / live Supabase mode.');
      return;
    }
    if (user) {
      const updated: UserProfile = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('webrajya_active_user', JSON.stringify(updated));
    }
  };

  const role = user?.role || 'STAFF';
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isStaff,
        isLoading,
        loading: isLoading,
        isAuthenticated,
        signIn,
        signInWithPassword,
        signInWithDemo,
        signOut,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
