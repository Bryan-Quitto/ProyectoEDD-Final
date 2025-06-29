import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { Course, ApiResponse, PaginatedResponse, Module } from '@plataforma-educativa/types';

export const CourseController = {
  async getAllCourses(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        difficulty,
        teacher_id,
        is_active = 'true',
        search
      } = req.query;

      let query = supabase
        .from('courses')
        .select(`
          *,
          profiles (
            full_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (difficulty) query = query.eq('difficulty_level', difficulty as string);
      if (teacher_id) query = query.eq('teacher_id', teacher_id as string);
      if (is_active !== 'all') query = query.eq('is_active', is_active === 'true');
      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const { data, error, count } = await query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

      if (error) throw error;
      
      const coursesWithInstructorName = data?.map(course => ({
        ...course,
        instructor_name: course.profiles?.full_name || null,
      })) || [];

      const response: ApiResponse<PaginatedResponse<Course>> = {
        data: { data: coursesWithInstructorName, total: count || 0, page: pageNum, limit: limitNum },
        error: null
      };
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  async getCourseById(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      if (!courseId) return res.status(400).json({ data: null, error: { message: 'ID del curso es requerido' } });

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (*)
          ),
          profiles (
            full_name
          )
        `)
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      
      const courseWithDetails = {
          ...data,
          instructor_name: data.profiles?.full_name || null,
      };

      res.status(200).json({ data: courseWithDetails, error: null });
    } catch (error) {
      const message = error instanceof Error ? 'Curso no encontrado' : 'Error interno del servidor';
      res.status(404).json({ data: null, error: { message } });
    }
  },

  async createCourse(req: Request, res: Response) {
    try {
      const { data, error } = await supabase.from('courses').insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json({ data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  async updateCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { data, error } = await supabase.from('courses').update(req.body).eq('id', courseId).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  async deleteCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { data, error } = await supabase.from('courses').delete().eq('id', courseId).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  async getCourseModules(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { data, error } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order_index');
      if (error) throw error;
      res.status(200).json({ data: data || [], error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  }
};