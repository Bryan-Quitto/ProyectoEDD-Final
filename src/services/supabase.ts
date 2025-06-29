import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) no están definidas.");
}

// Este es el cliente estándar para el frontend.
// NO incluye opciones de 'auth' que deshabiliten la persistencia.
// Automáticamente usará localStorage para recordar la sesión.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);