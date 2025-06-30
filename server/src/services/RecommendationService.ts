import { supabase } from '../config/supabaseAdmin';
import { DecisionTree } from '../recommendation/DecisionTree';
import type {
  PerformanceState,
  Recommendation,
  RecommendationAction,
  ApiResponse,
  PaginatedResponse,
  EvaluationContext,
} from '@plataforma-educativa/types';

export class RecommendationService {
  private decisionTree: DecisionTree;

  constructor() {
    this.decisionTree = new DecisionTree();
  }

  public async generateForEvaluation(context: EvaluationContext): Promise<ApiResponse<Recommendation[]>> {
    try {
      const actions = this.decisionTree.getRecommendationsFromEvaluation(context);
      const recommendations: Recommendation[] = [];

      for (const action of actions) {
          const recommendation = await this.createRecommendation(context.studentId, action, context.courseId, context.evaluation.lesson_id ?? undefined);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
      
      this.updateStudentPerformanceState(context.studentId, context.courseId);

      return { data: recommendations, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar recomendaciones post-evaluación';
      return { data: null, error: { message } };
    }
  }
  
  public async generateRecommendationsForStudent(studentId: string, courseId: string): Promise<ApiResponse<Recommendation[]>> {
    try {
      let performanceState = await this.getStudentPerformanceState(studentId, courseId);

      if (!performanceState) {
        const creationResult = await this.updateStudentPerformanceState(studentId, courseId);
        if (creationResult.error || !creationResult.data) {
          throw new Error(creationResult.error?.message || 'No se pudo crear el estado de rendimiento inicial.');
        }
        performanceState = creationResult.data;
      }

      const actions = this.decisionTree.generateRecommendations(performanceState);
      const recommendations: Recommendation[] = [];

      for (const action of actions) {
        const recommendation = await this.createRecommendation(studentId, action, courseId);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      return { data: recommendations, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor al generar recomendaciones';
      return { data: null, error: { message } };
    }
  }

  private async getStudentPerformanceState(studentId: string, courseId: string): Promise<PerformanceState | null> {
    try {
      const { data, error } = await supabase
        .from('performance_states')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();
      if (error) {
        return null;
      }
      return data as PerformanceState | null;
    } catch (error) {
      return null;
    }
  }

  private async createRecommendation(studentId: string, action: RecommendationAction, courseId?: string, lessonId?: string): Promise<Recommendation | null> {
    try {
      let finalTarget = action.target;
      let finalContentType = this.getContentType(finalTarget);

      if (action.target === '##FIRST_LESSON##' && courseId) {
        const { data: firstLesson } = await supabase
          .from('lessons')
          .select('id, modules!inner(course_id)')
          .eq('modules.course_id', courseId)
          .order('order_index', { ascending: true })
          .limit(1)
          .single();

        if (firstLesson) {
          finalTarget = firstLesson.id;
          finalContentType = 'lesson';
        } else {
          return null;
        }
      }

      const { data: existingRecommendation } = await supabase
        .from('recommendations')
        .select('id')
        .eq('student_id', studentId)
        .eq('title', action.title)
        .eq('is_applied', false)
        .maybeSingle();

      if (existingRecommendation) {
        return null;
      }
      
      const recommendationData = {
        student_id: studentId,
        recommendation_type: action.type,
        title: action.title,
        description: action.message,
        recommended_content_id: finalTarget,
        recommended_content_type: finalContentType,
        priority: action.priority,
        course_id: courseId,
        lesson_id: lessonId,
        is_read: false,
        is_applied: false,
        expires_at: this.calculateExpirationDate(action.priority)
      };

      const { data, error } = await supabase
        .from('recommendations')
        .insert(recommendationData)
        .select()
        .single();

      if (error) {
        console.error("[ERROR] No se pudo crear la recomendación en la BD:", error.message);
        return null;
      }
      return data as Recommendation;
    } catch (error) {
      return null;
    }
  }
  
  private getContentType(target: string): 'lesson' | 'course' | 'evaluation' | null {
    if (!target) return null;
    if (target.includes('##')) return null;
    if (target.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return 'lesson';
    }
    return null;
  }

  private calculateExpirationDate(priority: string): string {
    const now = new Date();
    let daysToAdd = 7;
    if (priority === 'high') daysToAdd = 3;
    if (priority === 'low') daysToAdd = 14;
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  public async getStudentRecommendations(studentId: string, page: number = 1, limit: number = 10, onlyUnread: boolean = false): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    try {
      let query = supabase
        .from('recommendations')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

      if (error) {
        return { data: null, error: { message: 'Error al obtener recomendaciones' } };
      }

      return {
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
        },
        error: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      return { data: null, error: { message } };
    }
  }

  public async markRecommendationAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .update({ is_read: true })
        .eq('id', recommendationId)
        .select()
        .single();

      if (error || !data) {
        return { data: null, error: { message: 'Error al marcar recomendación como leída o no encontrada' } };
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      return { data: null, error: { message } };
    }
  }

  public async markRecommendationAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .update({ is_applied: true })
        .eq('id', recommendationId)
        .select()
        .single();

      if (error || !data) {
        return { data: null, error: { message: 'Error al marcar recomendación como aplicada o no encontrada' } };
      }
      
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      return { data: null, error: { message } };
    }
  }

  public async updateStudentPerformanceState(studentId: string, courseId: string): Promise<ApiResponse<PerformanceState>> {
    try {
      const metrics = await this.calculatePerformanceMetrics(studentId, courseId);
      
      const performanceData = {
        student_id: studentId,
        course_id: courseId,
        overall_progress: metrics.overallProgress,
        average_score: metrics.averageScore,
        total_time_spent: metrics.totalTimeSpent,
        lessons_completed: metrics.lessonsCompleted,
        evaluations_passed: metrics.evaluationsPassed,
        current_difficulty: metrics.currentDifficulty,
        learning_pace: metrics.learningPace,
        last_activity: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('performance_states')
        .upsert(performanceData, { onConflict: 'student_id,course_id' })
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: 'Error al actualizar estado de rendimiento' } };
      }

      return { data: data as PerformanceState, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      return { data: null, error: { message } };
    }
  }

  private async calculatePerformanceMetrics(studentId: string, courseId: string) {
    const { data: progressData } = await supabase
      .from('student_progress')
      .select('status, time_spent, lessons!inner(module_id)')
      .eq('student_id', studentId)
      .eq('lessons.modules.course_id', courseId);

    const { data: attemptsData } = await supabase
      .from('evaluation_attempts')
      .select('passed, percentage, evaluations!inner(lesson_id)')
      .eq('student_id', studentId)
      .eq('evaluations.lessons.modules.course_id', courseId);

    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('id, modules!inner(course_id)', { count: 'exact', head: true })
      .eq('modules.course_id', courseId);

    const lessonsCompleted = progressData?.filter(p => p.status === 'completed').length || 0;
    const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
    const evaluationsPassed = attemptsData?.filter(a => a.passed).length || 0;
    
    let averageScore = 0;
    if (attemptsData && attemptsData.length > 0) {
      const totalPercentage = attemptsData.reduce((sum, a) => sum + (a.percentage || 0), 0);
      averageScore = Math.round(totalPercentage / attemptsData.length);
    }

    const overallProgress = (totalLessons && totalLessons > 0) ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;
    const currentDifficulty = averageScore >= 80 ? 'advanced' : averageScore >= 60 ? 'intermediate' : 'beginner';
    const learningPace = 'normal';

    return {
      overallProgress,
      averageScore,
      totalTimeSpent,
      lessonsCompleted,
      evaluationsPassed,
      currentDifficulty,
      learningPace
    };
  }

  public getDecisionTreeStats() {
    return this.decisionTree.getTreeStats();
  }
}