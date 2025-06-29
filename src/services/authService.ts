import { supabase } from './supabase';
import type { CreateUserData, ApiResponse, User, ApiError } from '@plataforma-educativa/types';
import type { AuthResponse } from '@supabase/supabase-js';
import axios from 'axios';

export const AuthService = {
  async signUp(userData: CreateUserData): Promise<{ error: ApiError | null }> {
    try {
      await axios.post('/api/auth/signup', userData);
      return { error: null };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Ocurrió un error durante el registro.';
      return { error: { message } };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    console.log(`[1] AuthService: getProfile INICIADO para userId: ${userId}`);
    
    try {
      console.log("[2] AuthService: Creando la consulta a Supabase...");
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log("[3] AuthService: EJECUTANDO la consulta con 'await'...");
      const { data, error } = await query;
      console.log("[4] AuthService: La consulta a Supabase HA TERMINADO.");

      if (error) {
        console.error("[5a] AuthService: Se encontró un ERROR en la respuesta de Supabase.", error);
        return { data: null, error: { message: error.message } };
      }

      if (data) {
        console.log("[5b] AuthService: Se encontraron DATOS en la respuesta.", data);
      } else {
        console.warn("[5c] AuthService: NO se encontraron datos (data es null), lo cual es normal si el perfil no existe.");
      }
      
      console.log("[6] AuthService: RETORNANDO resultado de getProfile.");
      return { data, error: null };

    } catch (e: any) {
      console.error("[X] AuthService: ¡CATCH! La función getProfile falló catastróficamente.", e);
      return { data: null, error: { message: e.message || "Error inesperado en el bloque catch." } };
    }
  },
};