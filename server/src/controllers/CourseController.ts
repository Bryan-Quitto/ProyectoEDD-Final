import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import type { Course, ApiResponse, PaginatedResponse, Module } from '@plataforma-educativa/types';

export class CourseController {
  getAllCourses = async (req: Request, res: Response) => {
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
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (difficulty) {
        query = query.eq('difficulty_level', difficulty as string);
      }
      if (teacher_id) {
        query = query.eq('teacher_id', teacher_id as string);
      }
      if (is_active !== 'all') {
        query = query.eq('is_active', is_active === 'true');
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const { data, error, count } = await query
        .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: error.message }
        };
        return res.status(400).json(apiResponse);
      }

      const response: ApiResponse<PaginatedResponse<Course>> = {
        data: {
          data: data || [],
          total: count || 0,
          page: pageNum,
          limit: limitNum
        },
        error: null
      };

      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };

  getCourseById = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'ID del curso es requerido' }
        };
        return res.status(400).json(apiResponse);
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Curso no encontrado' }
        };
        return res.status(404).json(apiResponse);
      }

      const response: ApiResponse<Course> = {
        data,
        error: null
      };

      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };

  createCourse = async (req: Request, res: Response) => {
    try {
      const { title, description, difficulty_level, estimated_duration, teacher_id } = req.body;

      if (!title || !description || !difficulty_level || !teacher_id) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Título, descripción, nivel de dificultad y ID del profesor son requeridos' }
        };
        return res.status(400).json(apiResponse);
      }

      const courseData = {
        title,
        description,
        difficulty_level,
        estimated_duration: estimated_duration || 0,
        teacher_id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Error al crear curso' }
        };
        return res.status(400).json(apiResponse);
      }

      const response: ApiResponse<Course> = {
        data,
        error: null
      };

      res.status(201).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };

  updateCourse = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const updateData = req.body;

      if (!courseId) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'ID del curso es requerido' }
        };
        return res.status(400).json(apiResponse);
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Error al actualizar curso' }
        };
        return res.status(400).json(apiResponse);
      }

      const response: ApiResponse<Course> = {
        data,
        error: null
      };

      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };

  deleteCourse = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'ID del curso es requerido' }
        };
        return res.status(400).json(apiResponse);
      }

      const { data, error } = await supabase
        .from('courses')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Error al eliminar curso' }
        };
        return res.status(400).json(apiResponse);
      }

      const response: ApiResponse<Course> = {
        data,
        error: null
      };

      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };

  getCourseModules = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'ID del curso es requerido' }
        };
        return res.status(400).json(apiResponse);
      }

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        const apiResponse: ApiResponse<null> = {
          data: null,
          error: { message: 'Error al obtener módulos del curso' }
        };
        return res.status(400).json(apiResponse);
      }

      const response: ApiResponse<Module[]> = {
        data: data || [],
        error: null
      };
      
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const apiResponse: ApiResponse<null> = {
        data: null,
        error: { message }
      };
      res.status(500).json(apiResponse);
    }
  };
}