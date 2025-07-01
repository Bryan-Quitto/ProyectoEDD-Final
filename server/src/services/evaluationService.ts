import { supabase } from '../config/supabaseAdmin';
import type { Evaluation, ApiResponse, EvaluationAttempt, Recommendation, Question, EvaluationContext } from '@plataforma-educativa/types';
import { StudentProgressService } from './studentProgressService';
import { ModuleProgressService } from './moduleProgressService';
import { RecommendationService } from './RecommendationService';

type CreateEvaluationData = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>;
type UpdateEvaluationData = Partial<Omit<CreateEvaluationData, 'lesson_id' | 'module_id'>>;
type StudentAnswers = Record<string, { answer: number[], type: Question['question_type'] }>;

interface SubmitAttemptResponse {
  attempt: EvaluationAttempt;
  recommendations?: Recommendation[];
}

export class EvaluationService {
  private studentProgressService: StudentProgressService;
  private moduleProgressService: ModuleProgressService;
  private recommendationService: RecommendationService;

  constructor() {
    this.studentProgressService = new StudentProgressService();
    this.moduleProgressService = new ModuleProgressService();
    this.recommendationService = new RecommendationService();
  }
  
  public async buildEvaluationContext(studentId: string, courseId: string, evaluationId: string, attemptId: string): Promise<EvaluationContext | null> {
    try {
      const { data: evaluation, error: evalError } = await this.getById(evaluationId);
      if (evalError || !evaluation) {
        return null;
      }
  
      const { data: attempt, error: attemptError } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('student_id', studentId)
        .single<EvaluationAttempt>();
  
      if (attemptError || !attempt) {
        return null;
      }
  
      const { data: allAttempts, error: allAttemptsError } = await this.getAttempts(evaluationId, studentId);
      if (allAttemptsError) {
        return null;
      }
  
      return {
        studentId,
        courseId,
        evaluation,
        attempt,
        allAttempts: allAttempts || [],
      };
  
    } catch (error) {
      return null;
    }
  }

  private async processModuleEvaluation(attempt: EvaluationAttempt): Promise<void> {
    const { data: evaluation, error: evalError } = await this.getById(attempt.evaluation_id);
    if (evalError || !evaluation || !evaluation.module_id) return;

    const courseId = (evaluation as any).modules?.course_id;
    if (!courseId) return;

    const context = await this.buildEvaluationContext(attempt.student_id, courseId, evaluation.id, attempt.id);
    if (!context) return;
    
    await this.recommendationService.generateForEvaluation(context);
    
    if (evaluation.evaluation_type !== 'diagnostic' && attempt.percentage < 90) {
        const performance_level = attempt.percentage < 70 ? 'low' : 'average';
        const { data: resources } = await supabase.from('module_support_resources').select('*').eq('module_id', evaluation.module_id).eq('performance_level', performance_level);

        if (resources && resources.length > 0) {
            const supportRecommendations = resources.map(res => ({
                student_id: attempt.student_id,
                course_id: courseId,
                recommendation_type: 'support_material' as const,
                title: `Recurso de Apoyo: ${res.title}`,
                description: `Para reforzar el módulo, te sugerimos este recurso: ${res.title}.`,
                priority: 'high' as const,
                recommended_content_id: res.id,
                recommended_content_type: res.resource_type as 'pdf' | 'url',
                action_url: res.url,
            }));
            await supabase.from('recommendations').insert(supportRecommendations);
        }
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

      const { data: pastAttempts } = await this.getAttempts(evaluationId, studentId);
      const maxAttempts = evaluation.max_attempts ?? 1;
      if(pastAttempts && pastAttempts.length >= maxAttempts) {
        throw new Error('Has alcanzado el número máximo de intentos.');
      }

      let score = 0;
      const questionsMap = new Map(evaluation.questions.map(q => [q.id, q]));
      for (const questionId in answers) {
        const question = questionsMap.get(questionId);
        const studentAnswer = answers[questionId].answer.sort();
        const correctAnswer = question?.correct_options?.sort();
        if (question && JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer)) {
          score += question.points;
        }
      }

      const percentage = evaluation.max_score > 0 ? Math.round((score / evaluation.max_score) * 100) : 0;
      const passed = percentage >= (evaluation.passing_score ?? 70);
      const attempt_number = (pastAttempts?.length || 0) + 1;
      const attemptData: Omit<EvaluationAttempt, 'id' | 'created_at' | 'time_taken_minutes'> = {
        evaluation_id: evaluationId, student_id: studentId, attempt_number, answers, score, max_score: evaluation.max_score, percentage, passed, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      };
      
      const { data: newAttempt, error: insertError } = await supabase.from('evaluation_attempts').insert(attemptData).select().single();
      if (insertError) throw insertError;
      
      if (evaluation.evaluation_type === 'diagnostic' && evaluation.module_id) {
          const diagnostic_level = percentage < 70 ? 'low' : percentage < 90 ? 'average' : 'high';
          await this.moduleProgressService.upsert(studentId, evaluation.module_id, { diagnostic_level, status: 'in_progress' });
          this.processModuleEvaluation(newAttempt);
      } else if (evaluation.module_id) {
          if(passed) await this.moduleProgressService.upsert(studentId, evaluation.module_id, { status: 'completed' });
          this.processModuleEvaluation(newAttempt);
      } else if (newAttempt.passed && evaluation.lesson_id) {
        await this.studentProgressService.markLessonAsCompleted(studentId, evaluation.lesson_id);
      }
      
      return { data: { attempt: newAttempt }, error: null };
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
      const response = await supabase.from('evaluations').select('*, modules(course_id)').eq('id', id).single();
      if (response.error) throw response.error;
      return { data: response.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluación no encontrada';
      return { data: null, error: { message } };
    }
  }
  
  async getByModuleId(moduleId: string, type?: Evaluation['evaluation_type']): Promise<ApiResponse<Evaluation[]>> {
    try {
        let query = supabase.from('evaluations').select('*').eq('module_id', moduleId);
        if (type) query = query.eq('evaluation_type', type);
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener la evaluación del módulo.';
      return { data: null, error: { message } };
    }
  }
}

export const evaluationService = new EvaluationService();