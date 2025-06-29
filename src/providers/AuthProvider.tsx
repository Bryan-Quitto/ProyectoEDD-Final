import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType, User, CreateUserData } from '@plataforma-educativa/types';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // useEffect para manejar la autenticación inicial y los cambios
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const supabaseUser = session?.user;
                if (supabaseUser) {
                    // Paso 1: Establecer un usuario básico inmediatamente
                    setUser(prevUser => ({
                        ...prevUser,
                        id: supabaseUser.id,
                        email: supabaseUser.email || '',
                    } as User));
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    // useEffect para enriquecer el perfil del usuario cuando tengamos su ID
    useEffect(() => {
        // Solo se ejecuta si tenemos un usuario básico pero sin el nombre completo
        if (user && user.id && !user.full_name) {
            AuthService.getProfile(user.id).then(({ data: profileData }) => {
                if (profileData) {
                    setUser(profileData); // Reemplaza el usuario básico con el perfil completo
                }
            });
        }
    }, [user]);

    const signIn = async (email: string, password: string) => {
        return AuthService.signIn(email, password);
    };

    const signUp = async (userData: CreateUserData) => {
        return AuthService.signUp(userData);
    };

    const signOut = async () => {
        await AuthService.signOut();
        setUser(null);
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