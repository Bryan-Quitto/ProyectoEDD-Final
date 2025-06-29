import { createContext } from 'react';
import type { AuthContextType } from '@plataforma-educativa/types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);