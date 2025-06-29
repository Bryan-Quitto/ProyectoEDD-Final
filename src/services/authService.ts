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
    
    try {
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await query;

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      if (data) {
        console.log("[5b] AuthService: Se encontraron DATOS en la respuesta.", data);
      } else {
      }
      
      return { data, error: null };

    } catch (e: any) {
      return { data: null, error: { message: e.message || "Error inesperado en el bloque catch." } };
    }
  },
};