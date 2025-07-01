import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Evaluation, EvaluationAttempt } from '@plataforma-educativa/types';
import { evaluationService } from '../services/evaluationService';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResult } from '../components/quiz/QuizResult';

const ModuleEvaluationPage: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const evaluationType = new URLSearchParams(location.search).get('type') as Evaluation['evaluation_type'] | null;

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<'loading' | 'quiz' | 'result'>('loading');
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<EvaluationAttempt[]>([]);

  const fetchInitialData = useCallback(async () => {
    if (!moduleId || !user || !evaluationType) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await evaluationService.getByModuleId(moduleId, evaluationType);
      if (apiError) throw new Error(apiError.message);
      if (!data) throw new Error(`No se encontró una ${evaluationType === 'diagnostic' ? 'prueba de diagnóstico' : 'evaluación'} para este módulo.`);
      const currentEval = Array.isArray(data) ? data[0] : data;
      setEvaluation(currentEval);

      const { data: attempts, error: attemptsError } = await evaluationService.getAttempts(currentEval.id, user.id);
      if (attemptsError) throw new Error(attemptsError.message);

      const history = attempts || [];
      setAttemptsHistory(history);
      const latestAttempt = history.length > 0 ? history[history.length - 1] : null;

      if (evaluationType === 'diagnostic' && latestAttempt) {
        setLastAttempt(latestAttempt);
        setViewState('result');
      } else if (latestAttempt && !evaluationType?.includes('diagnostic') && (latestAttempt.passed || (currentEval.max_attempts - history.length) <= 0)) {
        setLastAttempt(latestAttempt);
        setViewState('result');
      } else {
        setViewState('quiz');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, user, evaluationType]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleQuizComplete = (newAttempt: EvaluationAttempt) => {
    setLastAttempt(newAttempt);
    setAttemptsHistory(prev => [...prev, newAttempt]);
    setViewState('result');
    toast.success("¡Resultado guardado!", { duration: 4000 });
  };

  const handleRetry = () => {
    setLastAttempt(null);
    setViewState('quiz');
  };
  
  const handleContinue = async () => {
    if (!user || !courseId || !lastAttempt || !evaluation) {
      toast.error('Faltan datos para continuar.');
      return;
    }

    const toastId = toast.loading('Buscando siguiente lección...');

    try {
      console.log('[ModuleEvaluationPage] Llamando a generateForEvaluation con:', { 
        userId: user.id, 
        courseId, 
        evaluationId: evaluation.id, 
        attemptId: lastAttempt.id 
      });

      const result = await recommendationService.generateForEvaluation(user.id, courseId, evaluation.id, lastAttempt.id);
      console.log('[ModuleEvaluationPage] Resultado recibido del servicio API:', result);

      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast.success('Ruta actualizada. Redirigiendo al curso...', { id: toastId });
      navigate(`/course/${courseId}`, { state: { refresh: true } });

    } catch (err: any) {
      console.error('[ModuleEvaluationPage] Error en la llamada a la API:', err);
      toast.error(`Error: ${err.message || 'No se pudo determinar el siguiente paso.'}`, { id: toastId });
      setError('Error: Ruta no encontrada en la API');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (error) return <div className="container mx-auto p-8"><Alert variant="destructive">{error}</Alert></div>;
  if (!evaluation) return <div className="container mx-auto p-8"><Alert>Evaluación no disponible.</Alert></div>;

  const attemptsLeft = (evaluation.max_attempts || 1) - attemptsHistory.length;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to={`/course/${courseId}`} className="text-sm text-blue-600 hover:underline">← Volver al Curso</Link>
        </div>
        <main className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{evaluation.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{evaluation.description || 'Completa la siguiente evaluación.'}</p>
          </header>
          {viewState === 'quiz' && <QuizRunner evaluation={evaluation} onQuizComplete={handleQuizComplete} />}
          {viewState === 'result' && lastAttempt && (
            <QuizResult 
              attempt={lastAttempt} 
              onNext={handleContinue} 
              onRetry={handleRetry} 
              attemptsLeft={attemptsLeft}
              isDiagnostic={evaluationType === 'diagnostic'}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ModuleEvaluationPage;