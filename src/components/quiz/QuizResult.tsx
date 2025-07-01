import React from 'react';
import type { EvaluationAttempt } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface QuizResultProps {
  attempt: EvaluationAttempt;
  onNext: () => void;
  onRetry: () => void;
  attemptsLeft: number;
  isDiagnostic?: boolean;
}

export const QuizResult: React.FC<QuizResultProps> = ({ attempt, onNext, onRetry, attemptsLeft, isDiagnostic = false }) => {
  const Icon = attempt.passed ? CheckCircle : XCircle;
  const color = attempt.passed ? 'text-green-500' : 'text-red-500';
  const canRetry = !isDiagnostic && attemptsLeft > 0;
  const title = isDiagnostic ? 'Resultado de la Prueba de Diagnóstico' : 'Resultado de la Evaluación';
  const message = isDiagnostic 
    ? 'Hemos definido una ruta de aprendizaje para ti basada en tu resultado.'
    : (attempt.passed ? '¡Felicidades, has aprobado!' : 'Necesitas repasar un poco más.');

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-lg flex flex-col items-center">
      <Icon className={`h-20 w-20 mb-4 ${color}`} />
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      <p className="text-xl text-gray-600 mb-6">{message}</p>
      
      <div className="text-5xl font-extrabold mb-2">{attempt.percentage}%</div>
      <p className="text-gray-500 mb-8">
        Obtuviste {attempt.score} de {attempt.max_score} puntos.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {canRetry && (
          <Button onClick={onRetry} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Volver a Intentar ({attemptsLeft} {attemptsLeft === 1 ? 'restante' : 'restantes'})
          </Button>
        )}
        
        <Button onClick={onNext}>
          {isDiagnostic ? 'Ver mi Ruta de Aprendizaje' : 'Continuar'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {!attempt.passed && canRetry && (
        <p className="text-xs text-gray-500 mt-4">
          Debes aprobar la evaluación para continuar, o puedes usar tu siguiente intento.
        </p>
      )}
    </div>
  );
};