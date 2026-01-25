import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables. 
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Simple validation to check if URL is valid (starts with http/https) 
// and key is present.
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
const isValidKey = supabaseKey && supabaseKey.length > 0;

export const supabase = (isValidUrl && isValidKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
