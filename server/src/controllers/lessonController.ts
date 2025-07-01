import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { StudentProgress } from '@plataforma-educativa/types';

export const LessonController = {
  async createLesson(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase.from('lessons').insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json({ data, error: null });
    } catch (error) {
      res.status(400).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async getLessonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { student_id } = req.query;

      let query = supabase.from('lessons').select(`*, student_progress(status, student_id)`).eq('id', id);

      if (student_id) {
        query = query.eq('student_progress.student_id', student_id as string);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ data: null, error: { message: 'Lección no encontrada' } });
        return;
      }
      
      const { student_progress, ...lessonData } = data;
      const progress = Array.isArray(student_progress) ? student_progress[0] : null;

      const responseData = {
        ...lessonData,
        is_completed_by_user: progress?.status === 'completed',
      };

      res.status(200).json({ data: responseData, error: null });
    } catch (error) {
      res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async getLessonsByModule(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;
      const { data, error } = await supabase.from('lessons').select('*').eq('module_id', moduleId);
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async updateLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('lessons').update(req.body).eq('id', id).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(400).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async deleteLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('lessons').delete().eq('id', id).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(404).json({ data: null, error: { message: (error as Error).message } });
    }
  }
};