import { supabase } from '../config/supabase';
import { DecisionTree } from '../recommendation/DecisionTree';
import type {
  PerformanceState,
  Recommendation,
  RecommendationAction,
  ApiResponse,
  PaginatedResponse
} from '@plataforma-educativa/types';

export class RecommendationService {
  private decisionTree: DecisionTree;

  constructor() {
    this.decisionTree = new DecisionTree();
  }

  async generateRecommendationsForStudent(studentId: string): Promise<ApiResponse<Recommendation[]>> {
    try {
      const performanceState = await this.getStudentPerformanceState(studentId);

      if (!performanceState) {
        return { data: null, error: { message: 'No se encontró información de rendimiento para el estudiante' } };
      }

      const actions = this.decisionTree.generateRecommendations(performanceState);
      const recommendations: Recommendation[] = [];

      for (const action of actions) {
        const recommendation = await this.createRecommendation(studentId, action);
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

  private async getStudentPerformanceState(studentId: string): Promise<PerformanceState | null> {
    try {
      const { data, error } = await supabase
        .from('performance_states')
        .select('*')
        .eq('student_id', studentId)
        .single();
      if (error) {
        return null;
      }
      return data as PerformanceState | null;
    } catch (error) {
      return null;
    }
  }

  private async createRecommendation(studentId: string, action: RecommendationAction): Promise<Recommendation | null> {
    try {
      const recommendationData = {
        student_id: studentId,
        recommendation_type: this.mapActionTypeToRecommendationType(action.type),
        title: this.generateRecommendationTitle(action),
        description: action.message,
        recommended_content_id: action.target,
        recommended_content_type: this.getContentType(action.target),
        priority: action.priority,
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
        return null;
      }
      return data as Recommendation;
    } catch (error) {
      return null;
    }
  }

  private mapActionTypeToRecommendationType(actionType: string): 'content' | 'study_plan' | 'difficulty_adjustment' {
    switch (actionType) {
      case 'content':
      case 'review':
        return 'content';
      case 'pace':
        return 'study_plan';
      case 'difficulty':
        return 'difficulty_adjustment';
      default:
        return 'content';
    }
  }

  private generateRecommendationTitle(action: RecommendationAction): string {
    switch (action.type) {
      case 'content': return 'Contenido Recomendado';
      case 'review': return 'Revisión Sugerida';
      case 'pace': return 'Ajuste de Ritmo de Estudio';
      case 'difficulty': return 'Ajuste de Dificultad';
      default: return 'Recomendación Personalizada';
    }
  }

  private getContentType(target: string): 'lesson' | 'course' | 'evaluation' | null {
    if (target.includes('lesson')) return 'lesson';
    if (target.includes('course')) return 'course';
    if (target.includes('evaluation')) return 'evaluation';
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

  async getStudentRecommendations(studentId: string, page: number = 1, limit: number = 10, onlyUnread: boolean = false): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
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

  async markRecommendationAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
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

  async markRecommendationAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
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

  async updateStudentPerformanceState(studentId: string, courseId: string): Promise<ApiResponse<PerformanceState>> {
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
      .select(`*, lessons!inner(module_id, modules!inner(course_id))`)
      .eq('student_id', studentId)
      .eq('lessons.modules.course_id', courseId);

    const { data: attemptsData } = await supabase
      .from('evaluation_attempts')
      .select(`*, evaluations!inner(lesson_id, lessons!inner(module_id, modules!inner(course_id)))`)
      .eq('student_id', studentId)
      .eq('evaluations.lessons.modules.course_id', courseId);

    const totalLessons = progressData?.length || 0;
    const lessonsCompleted = progressData?.filter(p => p.status === 'completed').length || 0;
    const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
    const evaluationsPassed = attemptsData?.filter(a => a.passed).length || 0;
    
    let averageScore = 0;
    if (attemptsData && attemptsData.length > 0) {
      const totalPercentage = attemptsData.reduce((sum, a) => sum + (a.percentage || 0), 0);
      averageScore = totalPercentage / attemptsData.length;
    }

    const overallProgress = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;
    const currentDifficulty = averageScore >= 80 ? 'advanced' : averageScore >= 60 ? 'intermediate' : 'beginner';
    const learningPace = totalTimeSpent > 180 ? 'fast' : totalTimeSpent < 60 ? 'slow' : 'normal';

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

  getDecisionTreeStats() {
    return this.decisionTree.getTreeStats();
  }
}