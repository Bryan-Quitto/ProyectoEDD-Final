import { supabase } from '../config/supabaseAdmin';
import { DecisionTree } from '../recommendation/DecisionTree';
import { ModuleProgressService } from './moduleProgressService';
import type {
  Recommendation,
  RecommendationAction,
  ApiResponse,
  EvaluationContext,
  Lesson,
  CourseResource
} from '@plataforma-educativa/types';

export class RecommendationService {
  private decisionTree: DecisionTree;
  private moduleProgressService: ModuleProgressService;

  constructor() {
    this.decisionTree = new DecisionTree();
    this.moduleProgressService = new ModuleProgressService();
  }

  public async generateForEvaluation(context: EvaluationContext): Promise<ApiResponse<Recommendation[]>> {
    try {
      console.log('[RecService] Iniciando generateForEvaluation...');
      const { data: moduleProgress } = await this.moduleProgressService.get(context.studentId, context.evaluation.module_id!);
      
      const decisionContext = { ...context, moduleProgress };
      console.log('[RecService] Contexto para el árbol de decisión:', { studentId: context.studentId, evaluationType: context.evaluation.evaluation_type, percentage: context.attempt.percentage });
      
      const actions = this.decisionTree.getRecommendations(decisionContext);
      console.log(`[RecService] El árbol de decisión generó ${actions.length} acción(es):`, actions);

      const recommendations: Recommendation[] = [];

      for (const action of actions) {
        const recommendation = await this.createRecommendationFromAction(context, action);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
      console.log(`[RecService] Se crearon ${recommendations.length} recomendaciones en la BD.`);

      return { data: recommendations, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar recomendaciones post-evaluación';
      console.error('[RecService] Error fatal en generateForEvaluation:', message);
      return { data: null, error: { message } };
    }
  }

  private async createRecommendationFromAction(context: EvaluationContext, action: RecommendationAction): Promise<Recommendation | null> {
    console.log('[RecService] Procesando acción:', action);
    const { studentId, courseId, evaluation } = context;
    const moduleId = evaluation.module_id!;

    let recommendationData: Partial<Recommendation> = {
      student_id: studentId,
      course_id: courseId,
      recommendation_type: action.type,
      title: action.title,
      description: action.message,
      priority: action.priority,
    };

    switch(action.target) {
      case 'FIRST_CORE_LESSON':
      case 'FIRST_REMEDIAL_LESSON':
      case 'FIRST_ADVANCED_OR_CORE_LESSON': {
          const targetLevel = action.target.includes('REMEDIAL') ? 'remedial' : (action.target.includes('ADVANCED') ? 'advanced' : 'core');
          console.log(`[RecService] Buscando primera lección con nivel: ${targetLevel}`);
          const { data: lesson } = await this.findFirstLessonByLevel(moduleId, targetLevel);

          if (lesson) {
              console.log(`[RecService] Lección encontrada: ${lesson.title} (ID: ${lesson.id})`);
              recommendationData.recommended_content_id = lesson.id;
              recommendationData.recommended_content_type = 'lesson';
              recommendationData.action_url = `/course/${courseId}`;
          } else {
              console.warn(`[RecService] No se encontró ninguna lección de nivel '${targetLevel}' para el módulo ${moduleId}.`);
          }
          break;
      }
      case 'MODULE_GENERAL_RESOURCES': {
          console.log('[RecService] Buscando recursos generales del curso (PDFs)...');
          const { data: resources } = await this.findCourseResources(courseId);
          const pdfResources = resources?.filter(r => r.resource_type === 'pdf') || [];

          if (pdfResources.length > 0) {
              const resourceList = pdfResources.map(r => `- ${r.title}`).join('\n');
              recommendationData.description = `${action.message}\n\nPuedes consultar los siguientes PDFs:\n${resourceList}`;
          } else {
              console.log('[RecService] No se encontraron PDFs en los recursos generales.');
          }
          break;
      }
      default:
          console.log(`[RecService] La acción no requiere buscar contenido (target: ${action.target})`);
          break;
    }

    const { data, error } = await supabase.from('recommendations').insert(recommendationData).select().single();
    if (error) {
        console.error('Error creando recomendación en BD:', error);
        return null;
    }
    console.log('[RecService] Recomendación creada exitosamente en la BD.');
    return data;
  }

  private async findFirstLessonByLevel(moduleId: string, level: Lesson['target_level']): Promise<ApiResponse<Lesson | null>> {
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .eq('target_level', level)
            .order('order_index', { ascending: true })
            .limit(1)
            .maybeSingle();

        if(error) return { data: null, error };
        return { data, error: null };
    } catch(e) {
        return { data: null, error: { message: (e as Error).message } };
    }
  }

  private async findCourseResources(courseId: string): Promise<ApiResponse<CourseResource[] | null>> {
    try {
        const { data, error } = await supabase
            .from('course_resources')
            .select('*')
            .eq('course_id', courseId);
            
        if(error) return { data: null, error };
        return { data, error: null };
    } catch(e) {
        return { data: null, error: { message: (e as Error).message } };
    }
  }
}