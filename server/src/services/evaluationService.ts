import { supabase } from '../config/supabaseAdmin';
import type { Evaluation, ApiResponse, EvaluationAttempt } from '@plataforma-educativa/types';

type CreateEvaluationData = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>;
type UpdateEvaluationData = Partial<Omit<CreateEvaluationData, 'lesson_id'>>;
type StudentAnswers = Record<string, number[]>;

export class EvaluationService {
  async submitAttempt(evaluationId: string, studentId: string, answers: StudentAnswers): Promise<ApiResponse<EvaluationAttempt>> {
    try {
      const { data: evaluation, error: evalError } = await this.getById(evaluationId);
      if (evalError || !evaluation) throw new Error('Evaluación no encontrada.');

      let score = 0;
      const questionsMap = new Map(evaluation.questions.map(q => [q.id, q]));

      for (const questionId in answers) {
        const question = questionsMap.get(questionId);
        const studentAnswers = answers[questionId].sort();
        const correctAnswers = (question?.correct_options || []).sort();

        if (question && 
            studentAnswers.length === correctAnswers.length && 
            studentAnswers.every((val, index) => val === correctAnswers[index])) {
          score += question.points;
        }
      }

      const percentage = Math.round((score / evaluation.max_score) * 100);
      const passed = percentage >= evaluation.passing_score;
      
      const { data: latestAttempt } = await supabase.from('evaluation_attempts').select('attempt_number').eq('student_id', studentId).eq('evaluation_id', evaluationId).order('attempt_number', { ascending: false }).limit(1).single();
      const attempt_number = (latestAttempt?.attempt_number || 0) + 1;

      const attemptData: Omit<EvaluationAttempt, 'id' | 'created_at'> = {
        evaluation_id: evaluationId, student_id: studentId, attempt_number, answers, score, max_score: evaluation.max_score, percentage, passed, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      };
      
      const { data: newAttempt, error: insertError } = await supabase.from('evaluation_attempts').insert(attemptData).select().single();
      if (insertError) throw insertError;
      
      return { data: newAttempt, error: null };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar la evaluación.';
      return { data: null, error: { message } };
    }
  }

  async create(evaluationData: CreateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase.from('evaluations').insert([evaluationData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la evaluación';
      return { data: null, error: { message } };
    }
  }

  async getById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase.from('evaluations').select('*').eq('id', id).single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluación no encontrada';
      return { data: null, error: { message } };
    }
  }
  
  async getByLessonId(lessonId: string): Promise<ApiResponse<Evaluation[]>> {
    try {
      const { data, error } = await supabase.from('evaluations').select('*').eq('lesson_id', lessonId);
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener evaluaciones';
      return { data: null, error: { message } };
    }
  }

  async update(id: string, evaluationData: UpdateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase.from('evaluations').update(evaluationData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la evaluación';
      return { data: null, error: { message } };
    }
  }

  async remove(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const { data, error } = await supabase.from('evaluations').delete().eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la evaluación';
      return { data: null, error: { message } };
    }
  }
}