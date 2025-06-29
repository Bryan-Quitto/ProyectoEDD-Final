import React from 'react';
import type { EvaluationAttempt } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizResultProps {
  attempt: EvaluationAttempt;
  onNext: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ attempt, onNext }) => {
  const Icon = attempt.passed ? CheckCircle : XCircle;
  const color = attempt.passed ? 'text-green-500' : 'text-red-500';

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-lg flex flex-col items-center">
      <Icon className={`h-20 w-20 mb-4 ${color}`} />
      <h2 className="text-3xl font-bold mb-2">Resultado de la Evaluación</h2>
      <p className="text-xl text-gray-600 mb-6">
        {attempt.passed ? '¡Felicidades, has aprobado!' : 'Necesitas repasar un poco más.'}
      </p>
      
      <div className="text-5xl font-extrabold mb-2">{attempt.percentage}%</div>
      <p className="text-gray-500 mb-8">
        Obtuviste {attempt.score} de {attempt.max_score} puntos.
      </p>

      <Button onClick={onNext} size="lg">
        Continuar
      </Button>
    </div>
  );
};