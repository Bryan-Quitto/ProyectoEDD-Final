import { supabase } from '../config/supabase';
import type { Evaluation, ApiResponse } from '@plataforma-educativa/types';

type CreateEvaluationData = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>;
type UpdateEvaluationData = Partial<CreateEvaluationData>;

export class EvaluationService {
  async create(evaluationData: CreateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la evaluación';
      return { data: null, error: { message } };
    }
  }

  async getById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluación no encontrada';
      return { data: null, error: { message } };
    }
  }
  
  async getByLessonId(lessonId: string): Promise<ApiResponse<Evaluation[]>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener evaluaciones de la lección';
      return { data: null, error: { message } };
    }
  }

  async update(id: string, evaluationData: UpdateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .update(evaluationData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la evaluación';
      return { data: null, error: { message } };
    }
  }

  async remove(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la evaluación';
      return { data: null, error: { message } };
    }
  }
}