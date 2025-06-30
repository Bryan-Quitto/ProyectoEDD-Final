import { supabase } from '../config/supabaseAdmin';
import type { Evaluation, ApiResponse, EvaluationAttempt, Recommendation } from '@plataforma-educativa/types';
import { StudentProgressService } from './studentProgressService';

type CreateEvaluationData = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>;
type UpdateEvaluationData = Partial<Omit<CreateEvaluationData, 'lesson_id' | 'module_id'>>;
type StudentAnswers = Record<string, number[]>;

interface SubmitAttemptResponse {
  attempt: EvaluationAttempt;
  recommendations?: Recommendation[];
}

export class EvaluationService {
  private studentProgressService: StudentProgressService;

  constructor() {
    this.studentProgressService = new StudentProgressService();
  }

  private async invokeModuleEvaluationFunction(attemptId: string): Promise<Recommendation[] | undefined> {
    try {
      const { data, error } = await supabase.functions.invoke('process-module-evaluation', {
        body: { attempt_id: attemptId },
      });
      if (error) throw error;
      return data.recommendations;
    } catch (error) {
      console.error('Error al invocar la Edge Function process-module-evaluation:', error);
      return undefined;
    }
  }
  
  async getAttempts(evaluationId: string, studentId: string): Promise<ApiResponse<EvaluationAttempt[]>> {
    try {
      const response = await supabase.from('evaluation_attempts').select('*').eq('evaluation_id', evaluationId).eq('student_id', studentId).order('attempt_number', { ascending: true });
      if (response.error) throw response.error;
      return { data: response.data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener los intentos.';
      return { data: null, error: { message } };
    }
  }

  async submitAttempt(evaluationId: string, studentId: string, answers: StudentAnswers): Promise<ApiResponse<SubmitAttemptResponse>> {
    try {
      const { data: evaluation, error: evalError } = await this.getById(evaluationId);
      if (evalError || !evaluation) throw new Error('Evaluación no encontrada.');

      const { data: pastAttempts, error: attemptsError } = await this.getAttempts(evaluationId, studentId);
      if (attemptsError) throw new Error('No se pudo verificar el historial de intentos.');
      
      if(evaluation.lesson_id && pastAttempts && pastAttempts.length >= evaluation.max_attempts) {
        throw new Error('Has alcanzado el número máximo de intentos.');
      }

      let score = 0;
      const questionsMap = new Map(evaluation.questions.map(q => [q.id, q]));
      for (const questionId in answers) {
        const question = questionsMap.get(questionId);
        const studentAnswers = answers[questionId].sort();
        const correctAnswers = (question?.correct_options || []).sort();
        if (question && JSON.stringify(studentAnswers) === JSON.stringify(correctAnswers)) score += question.points;
      }

      const percentage = Math.round((score / evaluation.max_score) * 100);
      const passed = percentage >= evaluation.passing_score;
      const attempt_number = (pastAttempts?.length || 0) + 1;
      const attemptData: Omit<EvaluationAttempt, 'id' | 'created_at'> = {
        evaluation_id: evaluationId, student_id: studentId, attempt_number, answers, score, max_score: evaluation.max_score, percentage, passed, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      };
      
      const { data: newAttempt, error: insertError } = await supabase.from('evaluation_attempts').insert(attemptData).select().single();
      if (insertError) throw insertError;
      
      let recommendations: Recommendation[] | undefined;

      if (newAttempt.passed && evaluation.lesson_id) {
        await this.studentProgressService.markLessonAsCompleted(studentId, evaluation.lesson_id);
      } else if (evaluation.module_id) {
        recommendations = await this.invokeModuleEvaluationFunction(newAttempt.id);
      }
      
      return { data: { attempt: newAttempt, recommendations }, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar la evaluación.';
      return { data: null, error: { message } };
    }
  }

  async create(evaluationData: CreateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await supabase.from('evaluations').insert([evaluationData]).select().single();
      if (response.error) throw response.error;
      return { data: response.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la evaluación';
      return { data: null, error: { message } };
    }
  }
  
  async getById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await supabase.from('evaluations').select('*, lessons(module_id), modules(course_id)').eq('id', id).single();
      if (response.error) throw response.error;
      return { data: response.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluación no encontrada';
      return { data: null, error: { message } };
    }
  }
  
  async getByLessonId(lessonId: string): Promise<ApiResponse<Evaluation[]>> {
    try {
      const response = await supabase.from('evaluations').select('*').eq('lesson_id', lessonId);
      if (response.error) throw response.error;
      return { data: response.data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener evaluaciones de lección';
      return { data: null, error: { message } };
    }
  }
  
  async getByModuleId(moduleId: string): Promise<ApiResponse<Evaluation | null>> {
    try {
      const { data, error } = await supabase.from('evaluations').select('*').eq('module_id', moduleId).maybeSingle();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener la evaluación del módulo.';
      return { data: null, error: { message } };
    }
  }

  async update(id: string, evaluationData: UpdateEvaluationData): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await supabase.from('evaluations').update(evaluationData).eq('id', id).select().single();
      if (response.error) throw response.error;
      return { data: response.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la evaluación';
      return { data: null, error: { message } };
    }
  }

  async upsertByModule(moduleId: string, evalData: Partial<Evaluation>): Promise<ApiResponse<Evaluation>> {
    try {
      const fullEvalData = { ...evalData, module_id: moduleId, lesson_id: null };
      const { data, error } = await supabase.from('evaluations').upsert(fullEvalData, { onConflict: 'module_id' }).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar la evaluación del módulo.';
      return { data: null, error: { message } };
    }
  }

  async remove(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await supabase.from('evaluations').delete().eq('id', id).select().single();
      if (response.error) throw response.error;
      return { data: response.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la evaluación';
      return { data: null, error: { message } };
    }
  }
}