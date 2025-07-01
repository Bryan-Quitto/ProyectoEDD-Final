import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, User } from '@plataforma-educativa/types';

export const UserController = {
  async getTeachers(req: Request, res: Response): Promise<void> {
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
  },
  
async getAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const { search = '' } = req.query;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');

      if (search) {
        query = query.ilike('full_name', `%${search}%`);
      }
      
      const { data, error, count } = await query.order('full_name');
      
      if (error) throw error;

      res.status(200).json({ data: { data, total: count }, error: null });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener los estudiantes';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  async getUserById(req: Request, res: Response): Promise<void> {
    console.log('\n--- [BE] INICIO: getUserById ---');
    try {
      const { userId } = req.params;
      console.log(`[BE] Buscando usuario con ID: ${userId}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.error(`[BE] Usuario no encontrado con ID: ${userId}`);
          res.status(404).json({ data: null, error: { message: 'Usuario no encontrado' } });
          return;
        }
        throw error;
      }
      
      console.log(`[BE] ÉXITO: Usuario encontrado y enviado.`);
      res.status(200).json({ data, error: null });

    } catch (error) {
      console.error('[BE] ERROR CATASTRÓFICO en getUserById:', error);
      const message = error instanceof Error ? error.message : 'Error al obtener los datos del usuario';
      res.status(500).json({ data: null, error: { message } });
    }
  }
};