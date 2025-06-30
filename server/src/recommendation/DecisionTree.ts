import { DecisionNode, RecommendationAction, PerformanceState, EvaluationContext } from '@plataforma-educativa/types';

export class DecisionTree {
  private root: DecisionNode;
  private evaluationRoot: DecisionNode;

  constructor() {
    this.root = this.buildPerformanceDecisionTree();
    this.evaluationRoot = this.buildEvaluationDecisionTree();
  }

  public getRecommendationsFromEvaluation(context: EvaluationContext): RecommendationAction[] {
    const recommendations: RecommendationAction[] = [];
    this.traverseEvaluationTree(this.evaluationRoot, context, recommendations);
    return recommendations;
  }

  private traverseEvaluationTree(node: DecisionNode, context: EvaluationContext, actions: RecommendationAction[]): void {
    if (node.action) {
      actions.push(node.action);
    }

    if (!node.condition || (!node.trueNode && !node.falseNode)) {
      return;
    }

    const { attempt, allAttempts } = context;
    let conditionMet = false;

    switch (node.condition) {
      case 'did_pass_diagnostic':
        conditionMet = attempt.passed;
        break;
      case 'completed_60_percent_intro':
        conditionMet = true; 
        break;
      case 'did_pass_module_eval':
        conditionMet = attempt.passed;
        break;
      case 'score_between_50_70':
        conditionMet = attempt.percentage >= 50 && attempt.percentage <= 70;
        break;
      case 'repeated_eval_once':
        conditionMet = allAttempts.length > 1;
        break;
      case 'failed_eval_twice':
        conditionMet = allAttempts.filter(a => !a.passed).length >= 2;
        break;
    }

    const nextNode = conditionMet ? node.trueNode : node.falseNode;
    if (nextNode) {
      this.traverseEvaluationTree(nextNode, context, actions);
    }
  }

  private buildEvaluationDecisionTree(): DecisionNode {
    return {
      id: 'eval_root',
      condition: 'did_pass_diagnostic',
      trueNode: {
        id: 'eval_passed',
        condition: 'score_between_50_70',
        trueNode: {
          id: 'eval_barely_passed',
          condition: 'repeated_eval_once',
          falseNode: {
            id: 'suggest_retry',
            action: { type: 'support', target: 'self', priority: 'medium', title: 'Refuerzo Opcional', message: '¡Buen intento! Te sugerimos un segundo intento para afianzar conceptos. Aquí tienes material de apoyo adicional.'}
          },
          trueNode: {
            id: 'allow_advance_warning',
            action: { type: 'advance', target: 'next_lesson', priority: 'low', title: 'Puedes Avanzar', message: 'Has logrado pasar. Puedes continuar, pero ten en cuenta que podrías necesitar repasar estos temas más adelante.'}
          }
        },
        falseNode: { 
          id: 'eval_passed_well',
          action: { type: 'advance', target: 'next_lesson', priority: 'medium', title: '¡Excelente!', message: 'Has aprobado con una buena nota. ¡Sigue así y avanza a la siguiente lección!'}
        }
      },
      falseNode: {
        id: 'eval_failed',
        condition: 'failed_eval_twice',
        trueNode: {
          id: 'failed_multiple_times',
          action: { type: 'support', target: 'tutor', priority: 'high', title: 'Necesitas Ayuda Adicional', message: 'Has tenido dificultades con esta evaluación varias veces. Te recomendamos contactar a un tutor o usar el foro de ayuda.'}
        },
        falseNode: {
          id: 'failed_once',
          condition: 'completed_60_percent_intro',
          trueNode: {
            id: 'failed_but_reviewed',
            action: { type: 'remedial', target: 'remedial_content', priority: 'high', title: 'Contenido de Refuerzo', message: 'No te preocupes. Revisa este contenido remedial específico para aclarar tus dudas y vuelve a intentarlo.'}
          },
          falseNode: {
            id: 'failed_not_reviewed',
            action: { type: 'remedial', target: 'full_review', priority: 'high', title: 'Repaso Guiado Requerido', message: 'Parece que no has revisado los recursos introductorios. Te recomendamos un repaso guiado completo antes de volver a intentarlo.'}
          }
        }
      }
    };
  }

  private buildPerformanceDecisionTree(): DecisionNode {
    return {
      id: 'root',
      condition: 'overall_progress',
      threshold: 10,
      trueNode: {
        id: 'progress_started',
        condition: 'overall_progress',
        threshold: 70,
        trueNode: {
          id: 'high_progress',
          condition: 'average_score',
          threshold: 80,
          trueNode: {
            id: 'excellent_performance',
            action: { type: 'content', target: 'advanced_content', priority: 'high', title: 'Contenido Avanzado', message: '¡Excelente progreso! Te recomendamos contenido avanzado para seguir desafiándote.' }
          },
          falseNode: {
            id: 'good_progress_low_score',
            action: { type: 'review', target: 'previous_lessons', priority: 'medium', title: 'Revisión Sugerida', message: 'Buen progreso, pero considera revisar lecciones anteriores para mejorar tus calificaciones.' }
          }
        },
        falseNode: {
          id: 'medium_progress',
          condition: 'average_score',
          threshold: 60,
          trueNode: {
            id: 'steady_progress',
            action: { type: 'content', target: 'practice_exercises', priority: 'medium', title: 'Sigue Practicando', message: 'Vas por buen camino. Te sugerimos estos ejercicios de práctica para afianzar lo aprendido.' }
          },
          falseNode: {
            id: 'struggling_student',
            action: { type: 'support', target: 'tutor', priority: 'high', title: 'Busca Apoyo', message: 'Parece que estás teniendo dificultades. Considera pedir ayuda en los foros o contactar a un tutor.' }
          }
        }
      },
      falseNode: {
        id: 'low_progress_new_student',
        condition: 'lessons_completed',
        threshold: 1,
        falseNode: {
            id: 'start_here',
            action: { type: 'content', target: '##FIRST_LESSON##', priority: 'high', title: '¡Bienvenido/a!', message: '¡Qué bueno tenerte aquí! Te recomendamos empezar por la primera lección para arrancar con todo.' }
        },
        trueNode: {
            id: 'keep_going',
            action: { type: 'pace', target: 'study_schedule', priority: 'medium', title: '¡Sigue Así!', message: 'Ya has empezado, ¡no te detengas! Intenta establecer un horario de estudio para mantener el ritmo.' }
        }
      }
    };
  }
  
  public generateRecommendations(performanceState: PerformanceState): RecommendationAction[] {
    const recommendations: RecommendationAction[] = [];
    const action = this.traversePerformanceTree(this.root, performanceState);
    if (action) {
      recommendations.push(action);
    }
    return recommendations;
  }

  private traversePerformanceTree(node: DecisionNode, state: PerformanceState): RecommendationAction | null {
    if (node.action) {
      return node.action;
    }

    if (!node.condition || (!node.trueNode && !node.falseNode)) {
      return null;
    }

    const conditionValue = this.getConditionValue(node.condition, state);
    const threshold = node.threshold || 0;

    let shouldGoTrue = conditionValue >= threshold;

    const nextNode = shouldGoTrue ? node.trueNode : node.falseNode;
    return nextNode ? this.traversePerformanceTree(nextNode, state) : null;
  }

  private getConditionValue(condition: string, state: PerformanceState): number {
    switch (condition) {
      case 'overall_progress': return state.overall_progress;
      case 'average_score': return state.average_score;
      case 'time_spent': return state.total_time_spent;
      case 'evaluations_passed': return state.evaluations_passed;
      case 'lessons_completed': return state.lessons_completed;
      default: return 0;
    }
  }

  private getDaysSinceLastActivity(lastActivity: string): number {
    const lastDate = new Date(lastActivity);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  public updateTree(newRoot: DecisionNode): void {
    this.root = newRoot;
  }

  public getTreeStats(): { depth: number; nodeCount: number } {
    const perfTreeNodes = this.countNodes(this.root);
    const evalTreeNodes = this.countNodes(this.evaluationRoot);
    const perfTreeDepth = this.calculateDepth(this.root);
    const evalTreeDepth = this.calculateDepth(this.evaluationRoot);
    
    return {
      depth: Math.max(perfTreeDepth, evalTreeDepth),
      nodeCount: perfTreeNodes + evalTreeNodes
    };
  }

  private calculateDepth(node: DecisionNode | undefined): number {
    if (!node) return 0;
    if (!node.trueNode && !node.falseNode) return 1;
    const leftDepth = this.calculateDepth(node.trueNode);
    const rightDepth = this.calculateDepth(node.falseNode);
    return 1 + Math.max(leftDepth, rightDepth);
  }

  private countNodes(node: DecisionNode | undefined): number {
    if (!node) return 0;
    let count = 1;
    count += this.countNodes(node.trueNode);
    count += this.countNodes(node.falseNode);
    return count;
  }
}