import { supabase } from './supabase';
import type { CreateUserData, ApiResponse, User } from '@plataforma-educativa/types';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

export const AuthService = {
    async signUp(userData: CreateUserData): Promise<{ error: AuthError | null }> {
        const { error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password!,
            options: { data: { full_name: userData.full_name, role: userData.role || 'student' } },
        });
        return { error };
    },

    async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    },

    async signOut(): Promise<{ error: AuthError | null }> {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getProfile(userId: string): Promise<ApiResponse<User>> {
        console.log(`--- [AuthService] getProfile: Iniciando búsqueda para ${userId}`);
        try {
            const { data, error }: { data: User | null, error: PostgrestError | null } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            console.log(`--- [AuthService] getProfile: Respuesta de Supabase RECIBIDA:`, { data, error });
            if (error) {
                return { data: null, error: { message: error.message } };
            }
            return { data, error: null };
        } catch (catchError: unknown) {
            console.error("--- [AuthService] getProfile: CATCH - ¡La llamada a Supabase falló catastróficamente!", catchError);
            const message = catchError instanceof Error ? catchError.message : "Error de red o de configuración del cliente."
            return { data: null, error: { message } };
        }
    },
};