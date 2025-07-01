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

export const checkRole = (roles: Array<User['role']>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ error: { message: 'Acceso denegado. Se requiere autenticación.' } });
      return;
    }

    const userRole = req.user.role;
    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: { message: 'No tienes los permisos necesarios para realizar esta acción.' } });
      return;
    }
  };
};