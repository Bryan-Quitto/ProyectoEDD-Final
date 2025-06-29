import { supabase } from '../config/supabaseAdmin';
import type { Lesson, ApiResponse, Evaluation } from '@plataforma-educativa/types';
import { EvaluationService } from './evaluationService';

type CreateLessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'is_completed_by_user'>;
type UpdateLessonData = Partial<CreateLessonData>;

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
            content_url: lessonCoreData.content_url,
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
        };
        const { data: newEvaluation, error: evalError } = await this.evaluationService.create(evaluationPayload as Evaluation);
        
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

  async getByModuleId(moduleId: string): Promise<ApiResponse<Lesson[]>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`*, evaluation:evaluations(*)`)
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener lecciones del módulo';
      return { data: null, error: { message } };
    }
  }

  async update(id: string, lessonData: UpdateLessonData): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonData)
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