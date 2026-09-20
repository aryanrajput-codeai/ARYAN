import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fallback safe defaults using live WebRajya Supabase project
const fallbackUrl = 'https://gosfoxsylrapazhoorwu.supabase.co';
const fallbackKey = 'sb_publishable_venHPzDM2FsTpd8U2P_dOA_RSnXc1Ne';

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  fallbackUrl;

export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  fallbackKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('placeholder')
);

// Custom Storage adapter for React Native using AsyncStorage
const ExpoStorage = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase project credentials not configured in environment.',
    };
  }

  try {
    const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected to WebRajya Supabase database.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
}
