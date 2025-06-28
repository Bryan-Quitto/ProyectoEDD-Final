import { supabase } from './supabase';
import type { CreateUserData, AuthSuccessResponse } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const AuthService = {
  async signIn(email: string, password: string): Promise<ApiResponse<AuthSuccessResponse>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // Asegurarnos de que data no es nulo, aunque en un login exitoso nunca lo será.
      if (!data.user || !data.session) {
        throw new Error('Respuesta inesperada del servidor de autenticación.');
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signUp(userData: CreateUserData): Promise<ApiResponse<null>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password!,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No se pudo crear el usuario.');
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
        });

      if (profileError) {
        throw new Error(profileError.message);
      }

      return { success: true, message: '¡Registro exitoso! Por favor, revisa tu correo electrónico para verificar tu cuenta.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};