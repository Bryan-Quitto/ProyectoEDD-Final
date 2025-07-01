import type { RecommendationAction, EvaluationContext, ModuleProgress } from '@plataforma-educativa/types';

interface DecisionContext extends EvaluationContext {
  moduleProgress: ModuleProgress | null;
}

export class DecisionTree {
  public getRecommendations(context: DecisionContext): RecommendationAction[] {
    const actions: RecommendationAction[] = [];
    const evaluationType = context.evaluation.evaluation_type;

    if (evaluationType === 'diagnostic') {
      this.traverse(this.buildDiagnosticTree(), context, actions);
    } else {
      this.traverse(this.buildFinalEvaluationTree(), context, actions);
    }
    
    return actions;
  }

  private traverse(node: DecisionNode, context: DecisionContext, actions: RecommendationAction[]): void {
    if (node.action) {
      actions.push(node.action);
    }

    const nextNode = this.evaluateCondition(node, context);
    if (nextNode) {
      this.traverse(nextNode, context, actions);
    }
  }

  private evaluateCondition(node: DecisionNode, context: DecisionContext): DecisionNode | null {
    if (!node.condition) return null;

    const { attempt, allAttempts } = context;
    let conditionMet = false;

    switch (node.condition) {
      case 'is_high_performance':
        conditionMet = attempt.percentage >= 90;
        break;
      case 'is_average_performance':
        conditionMet = attempt.percentage >= 70 && attempt.percentage < 90;
        break;
      case 'is_low_performance':
        conditionMet = attempt.percentage < 70;
        break;
      case 'failed_twice':
        conditionMet = allAttempts.filter(a => !a.passed).length >= 2;
        break;
      case 'is_first_attempt':
        conditionMet = allAttempts.length === 1;
        break;
    }

    return conditionMet ? node.trueNode || null : node.falseNode || null;
  }

  private buildDiagnosticTree(): DecisionNode {
    return {
      id: 'diagnostic_root',
      condition: 'is_high_performance',
      trueNode: { // Alto rendimiento en diagnóstico
        id: 'diag_high',
        action: {
          type: 'advance',
          target: 'FIRST_ADVANCED_OR_CORE_LESSON',
          priority: 'high',
          title: '¡Excelente Comienzo!',
          message: 'Demuestras un gran dominio previo. Te recomendamos empezar directamente por este contenido para que aproveches al máximo tu tiempo.'
        }
      },
      falseNode: {
        id: 'diag_mid_or_low',
        condition: 'is_average_performance',
        trueNode: { // Rendimiento promedio en diagnóstico
          id: 'diag_avg',
          action: {
            type: 'content',
            target: 'FIRST_CORE_LESSON',
            priority: 'medium',
            title: '¡Buen Punto de Partida!',
            message: 'Tienes una base sólida. Te recomendamos empezar aquí para construir sobre lo que ya sabes.'
          }
        },
        falseNode: { // Bajo rendimiento en diagnóstico
          id: 'diag_low',
          action: {
            type: 'remedial',
            target: 'FIRST_REMEDIAL_LESSON',
            priority: 'high',
            title: '¡Vamos a Reforzar las Bases!',
            message: 'No te preocupes. Hemos preparado este contenido de refuerzo para que te pongas al día y avances con confianza. ¡Empieza por aquí!'
          }
        }
      }
    };
  }
  
  private buildFinalEvaluationTree(): DecisionNode {
    return {
      id: 'final_eval_root',
      condition: 'is_low_performance',
      trueNode: { // Reprobado
        id: 'eval_failed',
        condition: 'failed_twice',
        trueNode: {
            id: 'eval_failed_twice',
            action: { type: 'support', target: 'TUTOR_SUPPORT', priority: 'high', title: 'Busca Apoyo Adicional', message: 'Has tenido dificultades con esta evaluación. Te recomendamos encarecidamente contactar a un tutor para resolver tus dudas.' }
        },
        falseNode: {
            id: 'eval_failed_once',
            action: { type: 'support', target: 'LOW_PERFORMANCE_RESOURCES', priority: 'high', title: 'Material de Refuerzo Clave', message: 'No te desanimes. Revisa este material de apoyo que hemos seleccionado para ti y vuelve a intentarlo con más fuerza.' }
        }
      },
      falseNode: { // Aprobado
        id: 'eval_passed',
        condition: 'is_high_performance',
        trueNode: {
            id: 'eval_high',
            action: { type: 'praise', target: 'NONE', priority: 'medium', title: '¡Rendimiento Sobresaliente!', message: '¡Felicidades! Has completado el módulo con una nota excelente. ¡Sigue así!' }
        },
        falseNode: {
            id: 'eval_avg',
            action: { type: 'support', target: 'AVERAGE_PERFORMANCE_RESOURCES', priority: 'medium', title: '¡Buen Trabajo! Sigue Mejorando', message: 'Has aprobado el módulo. Para afianzar tus conocimientos, te sugerimos revisar estos recursos adicionales.' }
        }
      }
    };
  }
}

// Interfaz auxiliar para el árbol, ya que la del paquete de tipos es más genérica
interface DecisionNode {
  id: string;
  condition?: 'is_high_performance' | 'is_average_performance' | 'is_low_performance' | 'failed_twice' | 'is_first_attempt';
  trueNode?: DecisionNode;
  falseNode?: DecisionNode;
  action?: RecommendationAction;
}