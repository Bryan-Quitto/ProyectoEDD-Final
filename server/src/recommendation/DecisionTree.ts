import { DecisionNode, RecommendationAction, PerformanceState } from '../../../src/types';

export class DecisionTree {
  private root: DecisionNode;

  constructor() {
    this.root = this.buildDecisionTree();
  }

  // Construye el árbol de decisión para recomendaciones
  private buildDecisionTree(): DecisionNode {
    return {
      id: 'root',
      condition: 'overall_progress',
      threshold: 70,
      trueNode: {
        id: 'high_progress',
        condition: 'average_score',
        threshold: 80,
        trueNode: {
          id: 'excellent_performance',
          condition: 'learning_pace',
          threshold: 0, // string comparison
          action: {
            type: 'content',
            target: 'advanced_content',
            priority: 'high',
            message: 'Excelente progreso! Te recomendamos contenido avanzado para seguir desafiándote.'
          }
        },
        falseNode: {
          id: 'good_progress_low_score',
          condition: 'evaluations_passed',
          threshold: 3,
          trueNode: {
            id: 'review_needed',
            condition: '',
            action: {
              type: 'review',
              target: 'previous_lessons',
              priority: 'medium',
              message: 'Buen progreso, pero considera revisar lecciones anteriores para mejorar tus calificaciones.'
            }
          },
          falseNode: {
            id: 'practice_more',
            condition: '',
            action: {
              type: 'content',
              target: 'practice_exercises',
              priority: 'high',
              message: 'Necesitas más práctica. Te recomendamos ejercicios adicionales.'
            }
          }
        }
      },
      falseNode: {
        id: 'low_progress',
        condition: 'time_spent',
        threshold: 120, // minutos por semana
        trueNode: {
          id: 'slow_learner',
          condition: 'current_difficulty',
          threshold: 0,
          action: {
            type: 'difficulty',
            target: 'reduce_difficulty',
            priority: 'high',
            message: 'Considera reducir la dificultad del contenido para un mejor aprendizaje.'
          }
        },
        falseNode: {
          id: 'low_engagement',
          condition: 'last_activity',
          threshold: 7, // días
          trueNode: {
            id: 'motivational_content',
            condition: '',
            action: {
              type: 'content',
              target: 'motivational_lessons',
              priority: 'high',
              message: 'Te recomendamos contenido motivacional para retomar el ritmo de estudio.'
            }
          },
          falseNode: {
            id: 'increase_pace',
            condition: '',
            action: {
              type: 'pace',
              target: 'study_schedule',
              priority: 'medium',
              message: 'Intenta dedicar más tiempo al estudio para mejorar tu progreso.'
            }
          }
        }
      }
    };
  }

  // Evalúa el estado del estudiante y genera recomendaciones
  public generateRecommendations(performanceState: PerformanceState): RecommendationAction[] {
    const recommendations: RecommendationAction[] = [];
    const action = this.traverseTree(this.root, performanceState);
    
    if (action) {
      recommendations.push(action);
    }

    // Generar recomendaciones adicionales basadas en patrones específicos
    const additionalRecommendations = this.generateAdditionalRecommendations(performanceState);
    recommendations.push(...additionalRecommendations);

    return recommendations;
  }

  // Recorre el árbol de decisión
  private traverseTree(node: DecisionNode, state: PerformanceState): RecommendationAction | null {
    if (node.action) {
      return node.action;
    }

    if (!node.condition || (!node.trueNode && !node.falseNode)) {
      return null;
    }

    const conditionValue = this.getConditionValue(node.condition, state);
    const threshold = node.threshold || 0;

    let shouldGoTrue = false;

    // Evaluar condición según el tipo
    switch (node.condition) {
      case 'learning_pace':
        shouldGoTrue = state.learning_pace === 'fast';
        break;
      case 'current_difficulty':
        shouldGoTrue = state.current_difficulty === 'advanced';
        break;
      case 'last_activity':
        const daysSinceLastActivity = this.getDaysSinceLastActivity(state.last_activity);
        shouldGoTrue = daysSinceLastActivity <= threshold;
        break;
      default:
        shouldGoTrue = conditionValue >= threshold;
    }

    const nextNode = shouldGoTrue ? node.trueNode : node.falseNode;
    return nextNode ? this.traverseTree(nextNode, state) : null;
  }

  // Obtiene el valor de la condición del estado
  private getConditionValue(condition: string, state: PerformanceState): number {
    switch (condition) {
      case 'overall_progress':
        return state.overall_progress;
      case 'average_score':
        return state.average_score;
      case 'time_spent':
        return state.total_time_spent;
      case 'evaluations_passed':
        return state.evaluations_passed;
      case 'lessons_completed':
        return state.lessons_completed;
      default:
        return 0;
    }
  }

  // Calcula días desde la última actividad
  private getDaysSinceLastActivity(lastActivity: string): number {
    const lastDate = new Date(lastActivity);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Genera recomendaciones adicionales basadas en patrones
  private generateAdditionalRecommendations(state: PerformanceState): RecommendationAction[] {
    const recommendations: RecommendationAction[] = [];

    // Recomendación por tiempo de estudio
    if (state.total_time_spent < 60) {
      recommendations.push({
        type: 'pace',
        target: 'increase_study_time',
        priority: 'medium',
        message: 'Intenta dedicar al menos 1 hora por semana al estudio.'
      });
    }

    // Recomendación por progreso estancado
    if (state.overall_progress < 20 && state.lessons_completed === 0) {
      recommendations.push({
        type: 'content',
        target: 'introductory_content',
        priority: 'high',
        message: 'Comienza con las lecciones introductorias para familiarizarte con el contenido.'
      });
    }

    // Recomendación por bajo rendimiento en evaluaciones
    if (state.average_score < 60 && state.evaluations_passed < 2) {
      recommendations.push({
        type: 'review',
        target: 'study_materials',
        priority: 'high',
        message: 'Revisa los materiales de estudio antes de intentar más evaluaciones.'
      });
    }

    return recommendations;
  }

  // Actualiza el árbol de decisión (para futuras mejoras con ML)
  public updateTree(newRoot: DecisionNode): void {
    this.root = newRoot;
  }

  // Obtiene estadísticas del árbol
  public getTreeStats(): { depth: number; nodes: number } {
    return {
      depth: this.calculateDepth(this.root),
      nodes: this.countNodes(this.root)
    };
  }

  private calculateDepth(node: DecisionNode): number {
    if (!node.trueNode && !node.falseNode) {
      return 1;
    }

    const leftDepth = node.trueNode ? this.calculateDepth(node.trueNode) : 0;
    const rightDepth = node.falseNode ? this.calculateDepth(node.falseNode) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
  }

  private countNodes(node: DecisionNode): number {
    let count = 1;
    if (node.trueNode) count += this.countNodes(node.trueNode);
    if (node.falseNode) count += this.countNodes(node.falseNode);
    return count;
  }
}