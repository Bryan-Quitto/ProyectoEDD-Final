import { supabase } from '../config/supabaseAdmin';
import type { Lesson, ApiResponse, Evaluation } from '@plataforma-educativa/types';
import { EvaluationService } from './evaluationService';

type CreateLessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'is_completed_by_user'>;
type UpdateLessonData = Partial<Omit<CreateLessonData, 'module_id'>>;

export class LessonService {
  private evaluationService: EvaluationService;

  constructor() {
    this.evaluationService = new EvaluationService();
  }
  
  async create(lessonData: CreateLessonData): Promise<ApiResponse<Lesson>> {
    const { evaluation, ...lessonCoreData } = lessonData;

    try {
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
            module_id: lessonCoreData.module_id,
            title: lessonCoreData.title,
            content: lessonCoreData.content,
            lesson_type: lessonCoreData.lesson_type,
            target_level: lessonCoreData.target_level,
            estimated_duration: lessonCoreData.estimated_duration,
            order_index: lessonCoreData.order_index,
            is_active: lessonCoreData.is_active,
        })
        .select()
        .single();
      
      if (lessonError) throw lessonError;
      
      if (lessonCoreData.lesson_type === 'quiz' && evaluation) {
        const evaluationPayload = {
          ...evaluation,
          lesson_id: newLesson.id,
          module_id: null,
          evaluation_type: 'quiz',
        };
        const { data: newEvaluation, error: evalError } = await this.evaluationService.create(evaluationPayload as Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>);
        
        if (evalError) {
          await supabase.from('lessons').delete().eq('id', newLesson.id);
          throw new Error(`Error al crear la evaluación asociada: ${evalError.message}`);
        }
        
        newLesson.evaluation = newEvaluation;
      }
      
      return { data: newLesson, error: null };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la lección';
      return { data: null, error: { message } };
    }
  }

  async getById(id: string): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`*, evaluation:evaluations(*)`)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data && Array.isArray(data.evaluation)) {
        data.evaluation = data.evaluation[0] || null;
      }
      
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lección no encontrada';
      return { data: null, error: { message } };
    }
  }

  async getByModuleId(moduleId: string, studentId?: string): Promise<ApiResponse<Lesson[]>> {
    try {
        let query = supabase
            .from('lessons')
            .select(`
                *, 
                student_progress(status)
            `)
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true });

        if (studentId) {
            query = query.eq('student_progress.student_id', studentId);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        const lessons = data?.map(lesson => {
            const progress = (lesson.student_progress as unknown as { status: string }[]) || [];
            return {
                ...lesson,
                evaluation: null,
                is_completed_by_user: progress.some((p: { status: string }) => p.status === 'completed')
            }
        }) || [];

        return { data: lessons, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al obtener lecciones del módulo';
        return { data: null, error: { message } };
    }
  }

  async update(id: string, lessonData: UpdateLessonData): Promise<ApiResponse<Lesson>> {
    try {
      const { evaluation, ...lessonCoreData } = lessonData;
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonCoreData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la lección';
      return { data: null, error: { message } };
    }
  }

  async remove(id: string): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la lección';
      return { data: null, error: { message } };
    }
  }
}