import type { EvaluationAttempt, Evaluation, ApiResponse } from '@plataforma-educativa/types';
import { supabase } from './supabase';

type StudentAnswers = Record<string, number[]>;

export const evaluationService = {
  async getAttemptsHistory(evaluationId: string, studentId: string): Promise<ApiResponse<EvaluationAttempt[]>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { data: null, error: { message: "No hay una sesión activa." } };

      const response = await fetch(`/api/evaluations/${evaluationId}/attempts?student_id=${studentId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al obtener el historial de intentos');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async submitAttempt(evaluationId: string, answers: StudentAnswers): Promise<ApiResponse<EvaluationAttempt>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { data: null, error: { message: "No hay una sesión activa." } };

      const response = await fetch(`/api/evaluations/${evaluationId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al enviar la evaluación');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red al enviar el intento';
      return { data: null, error: { message } };
    }
  },

  async getByModuleId(moduleId: string): Promise<ApiResponse<Evaluation | null>> {
    try {
      const response = await fetch(`/api/evaluations/module/${moduleId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al obtener la evaluación del módulo');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async upsertByModuleId(moduleId: string, evalData: Partial<Evaluation>): Promise<ApiResponse<Evaluation>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { data: null, error: { message: "No hay una sesión activa." } };

      const response = await fetch(`/api/evaluations/module/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(evalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al guardar la evaluación del módulo');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async getEvaluationById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await fetch(`/api/evaluations/${id}`);
      if (!response.ok) throw new Error('Evaluación no encontrada');
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },
};