import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ESTA ES LA LÓGICA MÁS IMPORTANTE DEL PROYECTO
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Error de configuración: Las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas en el archivo .env. La aplicación no puede iniciarse.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);