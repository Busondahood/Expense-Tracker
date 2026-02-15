import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables. 
const env = (import.meta as any).env || {};

// Try to get variables from import.meta.env, fallback to process.env if available
const supabaseUrl = env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

// Simple validation to check if URL is valid (starts with http/https) 
// and key is present.
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
const isValidKey = supabaseKey && supabaseKey.length > 0;

export const supabase = (isValidUrl && isValidKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;