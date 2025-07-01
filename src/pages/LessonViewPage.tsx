import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonService } from '../services/lessonService';
import { evaluationService } from '../services/evaluationService';
import { studentProgressService } from '../services/studentProgressService';
import type { Lesson, EvaluationAttempt, Evaluation, TextContent, FillInTheBlankContent } from '@plataforma-educativa/types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResult } from '../components/quiz/QuizResult';
import { FillInTheBlankViewer } from '../components/lessons/FillInTheBlankViewer';
import { useAuth } from '../hooks/useAuth';

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [quizViewState, setQuizViewState] = useState<'quiz' | 'result'>('quiz');
  const [attemptsHistory, setAttemptsHistory] = useState<EvaluationAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);

  const fetchLessonData = useCallback(async () => {
    if (!lessonId || !user) return;
    setIsLoading(true);
    try {
      const lessonResponse = await lessonService.getLessonById(lessonId);
      if (lessonResponse.error || !lessonResponse.data) {
        throw new Error(lessonResponse.error?.message || 'Lección no encontrada.');
      }
      const currentLesson = lessonResponse.data;
      setLesson(currentLesson);
      setIsCompleted(currentLesson.is_completed_by_user || false);

      if (currentLesson.lesson_type === 'quiz' && currentLesson.evaluation?.id) {
        const historyResponse = await evaluationService.getAttempts(currentLesson.evaluation.id, user.id);
        if (historyResponse.error || !historyResponse.data) throw new Error('No se pudo cargar el historial del quiz.');
        
        const history = historyResponse.data;
        setAttemptsHistory(history);
        const latestAttempt = history.length > 0 ? history[history.length - 1] : null;

        if (latestAttempt) {
            setLastAttempt(latestAttempt);
            setQuizViewState('result');
        } else {
            setQuizViewState('quiz');
        }
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, user]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  const handleCompleteLesson = async () => {
    if (!lessonId || !user || !courseId || isCompleted) return;

    const promise = studentProgressService.markLessonAsCompleted(user.id, lessonId, courseId);
    toast.promise(promise, {
      loading: 'Guardando tu progreso...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        setIsCompleted(true);
        navigate(`/course/${courseId}`, { state: { refresh: true } });
        return '¡Lección completada! Volviendo al curso...';
      },
      error: (err) => `Error: ${err.message}`
    });
  };

  const handleQuizComplete = (newAttempt: EvaluationAttempt) => {
    setLastAttempt(newAttempt);
    setAttemptsHistory(prev => [...prev, newAttempt]);
    setQuizViewState('result');
    if (newAttempt.passed) {
      handleCompleteLesson();
    }
  };

  const handleQuizRetry = () => {
    setLastAttempt(null);
    setQuizViewState('quiz');
  }
 
  const renderLessonContent = () => {
    if (!lesson) return <Alert>No hay contenido disponible para esta lección.</Alert>;

    switch (lesson.lesson_type) {
      case 'text':
        if (!lesson.content) return <Alert>Contenido no disponible.</Alert>;
        const textContent = lesson.content as TextContent;
        return <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: textContent.text }} />;
      
      case 'fill_in_the_blank':
        if (!lesson.content) return <Alert>Contenido no disponible.</Alert>;
        const ftbContent = lesson.content as FillInTheBlankContent;
        return <FillInTheBlankViewer content={ftbContent} />;

      case 'quiz':
        if (!lesson.evaluation) return <Alert>La evaluación para este quiz no está disponible.</Alert>;
        if (quizViewState === 'result' && lastAttempt) {
            const attemptsLeft = (lesson.evaluation.max_attempts || 1) - attemptsHistory.length;
            return <QuizResult attempt={lastAttempt} onNext={handleCompleteLesson} onRetry={handleQuizRetry} attemptsLeft={attemptsLeft} />
        }
        return <QuizRunner evaluation={lesson.evaluation as Evaluation} onQuizComplete={handleQuizComplete} />;

      default:
        return <Alert>Este tipo de lección no es compatible.</Alert>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><Alert variant="destructive">{error}</Alert></div>;
  }

  if (!lesson) {
    return <div className="container mx-auto px-4 py-8"><Alert>No se pudo cargar la lección.</Alert></div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/course/${courseId}`} className="text-sm text-blue-600 hover:underline">← Volver al Curso</Link>
        </div>
        <main className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Duración estimada: {lesson.estimated_duration} min.</p>
          </header>
          <div className="mb-8 min-h-[300px]">
          {renderLessonContent()}
        </div>
          {lesson.lesson_type !== 'quiz' && (
            <footer className="flex flex-col sm:flex-row justify-end items-center pt-4 border-t mt-8">
                <Button 
                onClick={handleCompleteLesson} 
                variant="primary"
                disabled={isCompleted}
                >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isCompleted ? 'Lección Completada' : 'Marcar como Completada y Volver'}
                </Button>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default LessonViewPage;