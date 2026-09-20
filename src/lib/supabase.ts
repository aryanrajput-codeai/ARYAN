import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment or LocalStorage configuration
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const localUrl = localStorage.getItem('webrajya_supabase_url');
  const localKey = localStorage.getItem('webrajya_supabase_anon_key');

  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';

  // Check if it's a valid non-placeholder Supabase URL
  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project') &&
    key.length > 20 &&
    !key.includes('your-anon-key')
  );

  return { url, key, isConfigured };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('webrajya_supabase_url', url.trim());
  if (key) localStorage.setItem('webrajya_supabase_anon_key', key.trim());
}

export function clearSupabaseConfig() {
  localStorage.removeItem('webrajya_supabase_url');
  localStorage.removeItem('webrajya_supabase_anon_key');
}

const config = getSupabaseConfig();

// Default safe placeholder to prevent module load crash if not configured
const defaultUrl = config.isConfigured ? config.url : 'https://placeholder-webrajya.supabase.co';
const defaultKey = config.isConfigured ? config.key : 'placeholder-anon-key-000000000000000000000000000000';

export const supabase: SupabaseClient = createClient(defaultUrl, defaultKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const currentConfig = getSupabaseConfig();
  if (!currentConfig.isConfigured) {
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
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message: msg };
  }
}
