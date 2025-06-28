import { supabase } from '../config/supabase';
import { DecisionTree } from '../recommendation/DecisionTree';
import type { // Usar import type para los tipos como se recomendó antes
  PerformanceState,
  Recommendation,
  RecommendationAction,
  ApiResponse,
  PaginatedResponse
} from '../../../src/types';

export class RecommendationService {
  private decisionTree: DecisionTree;

  constructor() {
    this.decisionTree = new DecisionTree();
  }

  // Genera recomendaciones para un estudiante específico
  async generateRecommendationsForStudent(studentId: string): Promise<ApiResponse<Recommendation[]>> {
    try {
      // Obtener el estado de rendimiento del estudiante
      const performanceState = await this.getStudentPerformanceState(studentId);
      
      if (!performanceState) {
        return {
          success: false,
          error: 'No se encontró información de rendimiento para el estudiante'
        };
      }

      // Generar recomendaciones usando el árbol de decisión
      const actions = this.decisionTree.generateRecommendations(performanceState);
      
      // Convertir acciones a recomendaciones y guardar en la base de datos
      const recommendations: Recommendation[] = [];
      
      for (const action of actions) {
        const recommendation = await this.createRecommendation(studentId, action);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      return {
        success: true,
        data: recommendations,
        message: `Se generaron ${recommendations.length} recomendaciones`
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        success: false,
        error: 'Error interno del servidor al generar recomendaciones'
      };
    }
  }

  // Obtiene el estado de rendimiento de un estudiante
  private async getStudentPerformanceState(studentId: string): Promise<PerformanceState | null> {
    try {
      const { data, error } = await supabase
        .from('performance_states')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) {
        console.error('Error fetching performance state:', error);
        return null;
      }

      // Supabase .single() devuelve null si no encuentra un registro, o el objeto directamente.
      // Si la tabla estuviera vacía o no hubiera matching_id, data sería null.
      return data as PerformanceState | null;
    } catch (error) {
      console.error('Error in getStudentPerformanceState:', error);
      return null;
    }
  }

  // Crea una nueva recomendación en la base de datos
  private async createRecommendation(
    studentId: string, 
    action: RecommendationAction
  ): Promise<Recommendation | null> {
    try {
      const recommendationData = {
        student_id: studentId,
        recommendation_type: this.mapActionTypeToRecommendationType(action.type),
        title: this.generateRecommendationTitle(action),
        description: action.message,
        recommended_content_id: action.target !== 'study_schedule' ? action.target : null,
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
        console.error('Error creating recommendation:', error);
        return null;
      }

      // Supabase .single() devuelve null si no encuentra un registro después de la inserción,
      // lo cual no debería pasar si la inserción es exitosa.
      return data as Recommendation;
    } catch (error) {
      console.error('Error in createRecommendation:', error);
      return null;
    }
  }

  // Mapea tipos de acción a tipos de recomendación
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
        // Considerar un valor por defecto o lanzar un error si actionType es inesperado
        return 'content';
    }
  }

  // Genera título para la recomendación
  private generateRecommendationTitle(action: RecommendationAction): string {
    switch (action.type) {
      case 'content':
        return 'Contenido Recomendado';
      case 'review':
        return 'Revisión Sugerida';
      case 'pace':
        return 'Ajuste de Ritmo de Estudio';
      case 'difficulty':
        return 'Ajuste de Dificultad';
      default:
        return 'Recomendación Personalizada';
    }
  }

  // Determina el tipo de contenido basado en el target
  private getContentType(target: string): 'lesson' | 'course' | 'evaluation' | null {
    if (target.includes('lesson') || target.includes('content')) {
      return 'lesson';
    }
    if (target.includes('course')) {
      return 'course';
    }
    if (target.includes('evaluation') || target.includes('exercise')) {
      return 'evaluation';
    }
    return null;
  }

  // Calcula fecha de expiración basada en prioridad
  private calculateExpirationDate(priority: string): string {
    const now = new Date();
    let daysToAdd = 7; // Por defecto 7 días

    switch (priority) {
      case 'high':
        daysToAdd = 3;
        break;
      case 'medium':
        daysToAdd = 7;
        break;
      case 'low':
        daysToAdd = 14;
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  // Obtiene recomendaciones de un estudiante
  async getStudentRecommendations(
    studentId: string,
    page: number = 1,
    limit: number = 10,
    onlyUnread: boolean = false
  ): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    try {
      let query = supabase
        .from('recommendations')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        return {
          success: false,
          error: 'Error al obtener recomendaciones'
        };
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          data: data || [], // Asegura que 'data' sea un array vacío si es null
          total: count || 0,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting student recommendations:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  // Marca una recomendación como leída
  async markRecommendationAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .update({ is_read: true })
        .eq('id', recommendationId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: 'Error al marcar recomendación como leída'
        };
      }

      // Supabase .single() devuelve null si no encuentra el registro,
      // pero esperamos que lo encuentre para actualizar.
      if (!data) {
        return { success: false, error: 'Recomendación no encontrada' };
      }

      return {
        success: true,
        data,
        message: 'Recomendación marcada como leída'
      };
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  // Marca una recomendación como aplicada
  async markRecommendationAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .update({ is_applied: true })
        .eq('id', recommendationId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: 'Error al marcar recomendación como aplicada'
        };
      }
      
      // Supabase .single() devuelve null si no encuentra el registro,
      // pero esperamos que lo encuentre para actualizar.
      if (!data) {
        return { success: false, error: 'Recomendación no encontrada' };
      }

      return {
        success: true,
        data,
        message: 'Recomendación marcada como aplicada'
      };
    } catch (error) {
      console.error('Error marking recommendation as applied:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  // Actualiza el estado de rendimiento de un estudiante
  async updateStudentPerformanceState(
    studentId: string,
    courseId: string
  ): Promise<ApiResponse<PerformanceState>> {
    try {
      // Calcular métricas de rendimiento
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
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('performance_states')
        .upsert(performanceData, { onConflict: 'student_id,course_id' })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: 'Error al actualizar estado de rendimiento'
        };
      }

      // Supabase .single() devuelve null si no encuentra un registro después del upsert,
      // lo cual no debería pasar si el upsert es exitoso.
      return {
        success: true,
        data: data as PerformanceState,
        message: 'Estado de rendimiento actualizado'
      };
    } catch (error) {
      console.error('Error updating performance state:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  // Calcula métricas de rendimiento
  private async calculatePerformanceMetrics(studentId: string, courseId: string) {
    // Obtener progreso de lecciones
    const { data: progressData } = await supabase
      .from('student_progress')
      .select(`
        *,
        lessons!inner(module_id, modules!inner(course_id))
      `)
      .eq('student_id', studentId)
      .eq('lessons.modules.course_id', courseId);

    // Obtener intentos de evaluación
    const { data: attemptsData } = await supabase
      .from('evaluation_attempts')
      .select(`
        *,
        evaluations!inner(lesson_id, lessons!inner(module_id, modules!inner(course_id)))
      `)
      .eq('student_id', studentId)
      .eq('evaluations.lessons.modules.course_id', courseId);

    // --- Aplicación de la solución aquí ---
    const totalLessons = progressData?.length || 0;
    const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0;
    const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
    const passedEvaluations = attemptsData?.filter(a => a.passed).length || 0;
    
    let averageScore = 0;
    if (attemptsData !== null && attemptsData.length > 0) { // <--- SOLUCIÓN: Comprobar si attemptsData NO es null y tiene elementos
      averageScore = attemptsData.reduce((sum, a) => sum + a.percentage, 0) / attemptsData.length;
    }
    // --- Fin de la aplicación de la solución ---

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    // Determinar dificultad actual y ritmo de aprendizaje
    const currentDifficulty = averageScore >= 80 ? 'advanced' : averageScore >= 60 ? 'intermediate' : 'beginner';
    const learningPace = totalTimeSpent < 60 ? 'slow' : totalTimeSpent > 180 ? 'fast' : 'normal';

    return {
      overallProgress,
      averageScore,
      totalTimeSpent,
      lessonsCompleted: completedLessons,
      evaluationsPassed: passedEvaluations,
      currentDifficulty,
      learningPace
    };
  }

  // Obtiene estadísticas del árbol de decisión
  getDecisionTreeStats() {
    return this.decisionTree.getTreeStats();
  }
}