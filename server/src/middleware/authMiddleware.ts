import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { User } from '@plataforma-educativa/types';

interface AuthenticatedRequest extends Request {
  user?: User | null;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
       return next();
    }
    
    req.user = userProfile as User;
    
  } catch (err) {
    console.error("Error en middleware de autenticación:", err);
  }

  return next();
};