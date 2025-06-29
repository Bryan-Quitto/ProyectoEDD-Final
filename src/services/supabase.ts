import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("--- [supabase.ts] INICIALIZANDO CLIENTE ---");
console.log("URL:", supabaseUrl);
console.log("Anon Key:", supabaseAnonKey ? "****************" : "¡¡¡NO ENCONTRADA!!!");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL o Anon Key no están definidas en las variables de entorno. Asegúrate de que tu archivo .env.local existe y las variables tienen el prefijo VITE_");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);