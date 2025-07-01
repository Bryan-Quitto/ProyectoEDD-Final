import { supabase } from './supabase';
import type { ApiResponse, Evaluation, EvaluationAttempt } from '@plataforma-educativa/types';
import api from './api';

type StudentAnswers = Record<string, { answer: number[], type: string }>;

interface SubmitAttemptResponse {
  attempt: EvaluationAttempt;
}

export const evaluationService = {
  async getByModuleId(moduleId: string, type: Evaluation['evaluation_type']): Promise<ApiResponse<Evaluation | null>> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('module_id', moduleId)
        .eq('evaluation_type', type)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { data: data || null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: 'Error al obtener la evaluación del módulo.' } };
    }
  },

  async upsertModuleEvaluation(evalData: Partial<Evaluation>): Promise<ApiResponse<Evaluation>> {
    try {
      if (!evalData.module_id || !evalData.evaluation_type) {
        throw new Error('module_id y evaluation_type son requeridos');
      }

      const { data, error } = await supabase
        .from('evaluations')
        .upsert(evalData)
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
        return { data: null, error: { message: `Error al guardar la evaluación` } };
    }
  },

  async getAttempts(evaluationId: string, studentId: string): Promise<ApiResponse<EvaluationAttempt[]>> {
    try {
        const { data, error } = await supabase
            .from('evaluation_attempts')
            .select('*')
            .eq('evaluation_id', evaluationId)
            .eq('student_id', studentId)
            .order('attempt_number', { ascending: true });
        
        if (error) throw error;
        return { data, error: null };
    } catch(error: any) {
        return { data: null, error: { message: 'Error al obtener los intentos.' }};
    }
  },

  async submitAttempt(evaluationId: string, answers: StudentAnswers): Promise<ApiResponse<SubmitAttemptResponse>> {
    return api.post<SubmitAttemptResponse>(`/evaluations/${evaluationId}/submit`, { answers });
  }
};