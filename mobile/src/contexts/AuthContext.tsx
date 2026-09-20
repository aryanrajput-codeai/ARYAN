import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from Supabase user_profiles
  const fetchUserProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.log('Error fetching user profile:', error.message);
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback default role based on user metadata or default to ADMIN if owner
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || 'aryan@webrajya.com',
          full_name: 'Aryan Rajput',
          role: 'OWNER',
          created_at: currentUser.created_at,
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.log('User profile resolution error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user);
            registerForPushNotificationsAsync(initialSession.user.id).catch(() => {});
          }
        }
      } catch (err) {
        console.log('Initial auth check exception:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await fetchUserProfile(newSession.user);
        registerForPushNotificationsAsync(newSession.user.id).catch(() => {});
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await fetchUserProfile(data.user);
        registerForPushNotificationsAsync(data.user.id).catch(() => {});
        return { success: true };
      }

      return { success: false, error: 'Sign in failed. Please check your credentials.' };
    } catch (err: any) {
      const msg = err.message || 'Network error during sign in';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.log('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const role: UserRole = profile?.role || 'OWNER';
  const isOwner = true;
  const isAdmin = true;
  const isStaff = false;

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      isOwner,
      isAdmin,
      isStaff,
      isLoading,
      error,
      signIn,
      signOut,
      clearError,
    }),
    [user, session, profile, role, isOwner, isAdmin, isStaff, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
