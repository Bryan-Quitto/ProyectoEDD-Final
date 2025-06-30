import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Evaluation, EvaluationAttempt } from '@plataforma-educativa/types';
import { evaluationService } from '../services/evaluationService';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResult } from '../components/quiz/QuizResult';

const ModuleEvaluationPage: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<EvaluationAttempt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!moduleId || !user) return;
    setIsLoading(true);
    try {
      const { data, error: apiError } = await evaluationService.getByModuleId(moduleId);
      if (apiError) throw new Error(apiError.message);
      if (!data) throw new Error("No se encontró una evaluación para este módulo.");
      setEvaluation(data);

      const { data: attempts, error: attemptsError } = await evaluationService.getAttemptsHistory(data.id, user.id);
      if (attemptsError) throw new Error(attemptsError.message);

      setAttemptsHistory(attempts || []);
      if (attempts && attempts.length > 0) {
        setLastAttempt(attempts[attempts.length - 1]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleQuizComplete = (newAttempt: EvaluationAttempt) => {
    setLastAttempt(newAttempt);
    setAttemptsHistory(prev => [...prev, newAttempt]);
    
    setIsProcessing(true);
    toast('Procesando tu resultado y generando consejos...', { icon: '🤖', duration: 3000 });

    setTimeout(() => {
        setIsProcessing(false);
        toast.success("¡Módulo evaluado! Revisa la página del curso para ver tus nuevos consejos.", { duration: 4000 });
        navigate(`/course/${courseId}`, { state: { refresh: true } });
    }, 3000); // 3 segundos de espera para la Edge Function
  };

  const handleRetry = () => {
    setLastAttempt(null);
  };
  
  const handleContinue = () => {
    navigate(`/course/${courseId}`, { state: { refresh: true } });
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (error) return <div className="container mx-auto p-8"><Alert variant="destructive">{error}</Alert></div>;
  if (!evaluation) return <div className="container mx-auto p-8"><Alert>Evaluación no disponible.</Alert></div>;

  if (isProcessing) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 font-semibold">Analizando tu rendimiento...</p>
        </div>
    );
  }
  
  const attemptsLeft = evaluation.max_attempts - attemptsHistory.length;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to={`/course/${courseId}`} className="text-sm text-blue-600 hover:underline">← Volver al Curso</Link>
        </div>
        <main className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{evaluation.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{evaluation.description || 'Evaluación final del módulo.'}</p>
          </header>
          {lastAttempt ? (
            <QuizResult attempt={lastAttempt} onNext={handleContinue} onRetry={handleRetry} attemptsLeft={attemptsLeft} />
          ) : (
            <QuizRunner evaluation={evaluation} onQuizComplete={handleQuizComplete} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ModuleEvaluationPage;