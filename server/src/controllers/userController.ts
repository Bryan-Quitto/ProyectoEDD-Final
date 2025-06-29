import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, User } from '@plataforma-educativa/types';

export const UserController = {
  async getTeachers(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'teacher');
      
      if (error) throw error;

      res.status(200).json({ data: data || [], error: null });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener la lista de profesores';
      res.status(500).json({ data: null, error: { message } });
    }
  }
};