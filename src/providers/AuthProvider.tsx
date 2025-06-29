import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType, User, CreateUserData, ApiError } from '@plataforma-educativa/types';
import type { AuthError } from '@supabase/supabase-js';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Verificamos la sesión al cargar la página por primera vez.
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profileData } = await AuthService.getProfile(session.user.id);
                setUser(profileData || null);
            }
            // Solo cuando todo ha terminado, dejamos de cargar.
            setLoading(false);
        };
        
        checkUser();

        // 2. Escuchamos solo para cambios FUTUROS (logout).
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);
    
    // 3. El signIn ahora maneja su propio estado.
    const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
        const { data, error } = await AuthService.signIn(email, password);
        if (data.user) {
            const { data: profileData } = await AuthService.getProfile(data.user.id);
            setUser(profileData || null);
        }
        return { error };
    };

    const signUp = async (userData: CreateUserData): Promise<{ error: ApiError | null }> => {
        return AuthService.signUp(userData);
    };

    const signOut = async (): Promise<void> => {
        await AuthService.signOut();
        // El listener se encargará de poner el usuario a null.
    };

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signUp,
        signOut
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};