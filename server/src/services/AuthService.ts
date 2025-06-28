import { supabase } from '../config/supabase';
import type { CreateUserData, ApiResponse, AuthResponse } from '../../../src/types/index';

export class AuthService {
    async signUp(userData: CreateUserData): Promise<ApiResponse<AuthResponse>> {
        const { email, password, full_name, role } = userData;
    
        if (!password) {
          return {
            success: false,
            error: 'La contraseña es requerida para el registro.',
          };
        }
    
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password, // Ahora TypeScript sabe que password es un string
          options: {
            data: {
              full_name,
              role,
            },
          },
        });
        
    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'No se pudo crear el usuario en Supabase Auth.',
      };
    }

    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name,
      role,
    });

    if (dbError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: 'Error al guardar el usuario en la base de datos.',
        message: dbError.message,
      };
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
      },
      message: 'Usuario registrado exitosamente. Por favor, revisa tu correo para verificar tu cuenta.',
    };
  }

  async signIn(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: 'Credenciales inválidas.',
        message: error.message,
      };
    }

    return {
      success: true,
      data,
      message: 'Inicio de sesión exitoso.',
    };
  }

  async signOut(token: string): Promise<ApiResponse<null>> {
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      return {
        success: false,
        error: 'No se pudo cerrar la sesión.',
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Sesión cerrada exitosamente.',
    };
  }
}