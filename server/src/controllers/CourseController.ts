import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Course, ApiResponse, PaginatedResponse } from '../../../src/types';

export class CourseController {
  // Obtener todos los cursos
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

      // Aplicar filtros
      if (difficulty) {
        query = query.eq('difficulty_level', difficulty);
      }
      if (teacher_id) {
        query = query.eq('teacher_id', teacher_id);
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
        return res.status(400).json({
          success: false,
          error: 'Error al obtener cursos'
        });
      }

      const totalPages = Math.ceil((count || 0) / limitNum);

      const response: ApiResponse<PaginatedResponse<Course>> = {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Obtener curso por ID
  getCourseById = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'ID del curso es requerido'
        });
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        return res.status(404).json({
          success: false,
          error: 'Curso no encontrado'
        });
      }

      const response: ApiResponse<Course> = {
        success: true,
        data
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getCourseById:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Crear nuevo curso
  createCourse = async (req: Request, res: Response) => {
    try {
      const { title, description, difficulty_level, estimated_duration, teacher_id } = req.body;
      
      if (!title || !description || !difficulty_level || !teacher_id) {
        return res.status(400).json({
          success: false,
          error: 'Título, descripción, nivel de dificultad y ID del profesor son requeridos'
        });
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
        return res.status(400).json({
          success: false,
          error: 'Error al crear curso'
        });
      }

      const response: ApiResponse<Course> = {
        success: true,
        data,
        message: 'Curso creado exitosamente'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error in createCourse:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Actualizar curso
  updateCourse = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const updateData = req.body;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'ID del curso es requerido'
        });
      }

      // Agregar timestamp de actualización
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Error al actualizar curso'
        });
      }

      const response: ApiResponse<Course> = {
        success: true,
        data,
        message: 'Curso actualizado exitosamente'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in updateCourse:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Eliminar curso (soft delete)
  deleteCourse = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'ID del curso es requerido'
        });
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
        return res.status(400).json({
          success: false,
          error: 'Error al eliminar curso'
        });
      }

      const response: ApiResponse<Course> = {
        success: true,
        data,
        message: 'Curso eliminado exitosamente'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in deleteCourse:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Obtener módulos de un curso
  getCourseModules = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'ID del curso es requerido'
        });
      }

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Error al obtener módulos del curso'
        });
      }

      res.status(200).json({
        success: true,
        data: data || [],
        message: `Se encontraron ${data?.length || 0} módulos`
      });
    } catch (error) {
      console.error('Error in getCourseModules:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };
}