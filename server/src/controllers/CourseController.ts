import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { Course, ApiResponse, PaginatedResponse, Module, Lesson, TextLessonSubmission, StudentProgress } from '@plataforma-educativa/types';

export const CourseController = {
  // ... (getAllCourses sigue igual)
  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const {
        search = '',
        difficulty,
        is_active = 'true'
      } = req.query;

      const { data, error } = await supabase.rpc('get_all_courses', {
        search_term: search as string,
        difficulty_filter: (difficulty === 'all' || difficulty === 'undefined') ? null : difficulty as string,
        teacher_filter: null,
        active_filter: is_active as string
      });

      if (error) throw error;
      
      const courses = data || [];
      const pageNum = parseInt((req.query.page as string) || '1', 10);
      const limitNum = parseInt((req.query.limit as string) || '10', 10);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = courses.slice(startIndex, startIndex + limitNum);

      const response: ApiResponse<PaginatedResponse<Course>> = {
        data: { data: paginatedData, total: courses.length, page: pageNum, limit: limitNum },
        error: null
      };
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  // ... (getCourseById sigue igual)
  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { student_id } = req.query;

      let query = supabase
        .from('courses')
        .select(`
          *,
          profiles(full_name),
          course_resources(*),
          modules(*,
            evaluations(*), 
            lessons(*,
              text_lesson_submissions(
                id, status, score, feedback, content, submitted_at, graded_at
              ),
              student_progress(
                status,
                student_id
              )
            )
          )
        `)
        .eq('id', courseId);
      
      if (student_id) {
        query = query.eq('modules.lessons.student_progress.student_id', student_id as string);
      }

      const { data, error } = await query.single();
      
      if (error) throw error;
      
      const { profiles, modules, ...restOfData } = data;

      const modulesWithCompletion = modules.map((module: Module & { lessons: any[] }) => ({
        ...module,
        lessons: module.lessons.map((lesson: Lesson & { text_lesson_submissions: TextLessonSubmission[], student_progress: StudentProgress[] }) => {
          const progress = lesson.student_progress ? lesson.student_progress[0] : null;
          return {
            ...lesson,
            submission: lesson.text_lesson_submissions[0] || null,
            is_completed_by_user: progress?.status === 'completed',
            text_lesson_submissions: undefined,
            student_progress: undefined,
          };
        }),
      }));

      const courseWithDetails = {
        ...restOfData,
        instructor_name: profiles?.full_name,
        modules: modulesWithCompletion
      };
      
      res.status(200).json({ data: courseWithDetails, error: null });

    } catch (error) {
      const message = error instanceof Error && error.message.includes('PGRST116') ? 'Curso no encontrado' : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  // ... (createCourse sigue igual)
  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase.from('courses').insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json({ data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  // --- FUNCIÓN CORREGIDA ---
  async updateCourse(req: Request, res: Response): Promise<void> {
    console.log('\n--- [BE] INICIO: updateCourse ---');
    try {
      const { courseId } = req.params;
      const updateData = req.body;
      
      console.log('[BE] Recibido body para actualizar:', updateData);

      // Sanitizamos el objeto para asegurarnos de que solo contiene campos válidos de la tabla 'courses'
      const validCourseFields: (keyof Course)[] = [
        'title', 'description', 'difficulty_level', 'estimated_duration', 
        'teacher_id', 'is_active', 'image_url'
      ];

      const sanitizedData: Partial<Course> = {};
      for (const key of validCourseFields) {
        if (updateData[key] !== undefined) {
          sanitizedData[key] = updateData[key];
        }
      }
      
      console.log('[BE] Body sanitizado para enviar a Supabase:', sanitizedData);

      if (Object.keys(sanitizedData).length === 0) {
        console.warn('[BE] ADVERTENCIA: No hay campos válidos para actualizar.');
          res.status(400).json({ data: null, error: { message: 'No se proporcionaron campos válidos para actualizar.' } });
      }

      const { data, error } = await supabase
        .from('courses')
        .update(sanitizedData)
        .eq('id', courseId)
        .select()
        .single();
        
      if (error) {
        console.error('[BE] ERROR de Supabase durante la actualización:', error);
        throw error;
      }
      
      console.log('[BE] ÉXITO: Curso actualizado.');
      res.status(200).json({ data, error: null });
    } catch (error) {
      console.error('[BE] ERROR CATASTRÓFICO en updateCourse:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ data: null, error: { message } });
    }
  },

  // ... (deleteCourse y getCourseModules siguen igual)
  async deleteCourse(req: Request, res: Response): Promise<void> {
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

  async getCourseModules(req: Request, res: Response): Promise<void> {
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