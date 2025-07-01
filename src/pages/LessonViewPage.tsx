import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonService } from '../services/lessonService';
import { evaluationService } from '../services/evaluationService';
import { studentProgressService } from '../services/studentProgressService';
import type { Lesson, EvaluationAttempt, Evaluation, FillInTheBlankContent, TextContent } from '@plataforma-educativa/types';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResult } from '../components/quiz/QuizResult';
import { FillInTheBlankViewer } from '../components/lessons/FillInTheBlankViewer';
import { useAuth } from '../hooks/useAuth';
import { TextSubmissionHandler } from '../components/lessons/TextSubmissionHandler';

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isActivityFinished, setIsActivityFinished] = useState(false);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [quizViewState, setQuizViewState] = useState<'quiz' | 'result'>('quiz');
  const [attemptsHistory, setAttemptsHistory] = useState<EvaluationAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);

  const fetchLessonData = useCallback(async () => {
    if (!lessonId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: lessonData, error: lessonError } = await lessonService.getLessonById(lessonId, user.id);
      
      if (lessonError || !lessonData) {
        throw new Error(lessonError?.message || 'Lección no encontrada.');
      }
      
      const completed = lessonData.is_completed_by_user || false;
      
      setLesson(lessonData);
      setIsCompleted(completed);

      if (completed) {
        setIsActivityFinished(true);
      } else {
        if (lessonData.estimated_duration > 0 && (lessonData.lesson_type === 'fill_in_the_blank' || lessonData.lesson_type === 'text')) {
          setTimeLeft(lessonData.estimated_duration * 60);
        }
        if (lessonData.lesson_type === 'text' && lessonData.target_level === 'advanced') {
          setIsActivityFinished(true);
        }
      }

      if (lessonData.lesson_type === 'quiz' && lessonData.evaluation?.id) {
        const { data: history, error: historyError } = await evaluationService.getAttempts(lessonData.evaluation.id, user.id);
        if (historyError || !history) throw new Error('No se pudo cargar el historial del quiz.');
        
        setAttemptsHistory(history);
        const latestAttempt = history.length > 0 ? history[history.length - 1] : null;

        if (latestAttempt) {
            setLastAttempt(latestAttempt);
            setQuizViewState('result');
            if(latestAttempt.passed) setIsActivityFinished(true);
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
  
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isActivityFinished) return;
    const timerId = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isActivityFinished]);

  const handleActivityCompletion = useCallback(() => {
    setIsActivityFinished(true);
    toast.success('¡Actividad completada! Ahora puedes marcar la lección como finalizada.');
  }, []);

  const handleMarkAsCompleted = async () => {
    if (!lessonId || !user || !courseId) return;
    setIsSubmittingCompletion(true);
    const { error } = await studentProgressService.markLessonAsCompleted(user.id, lessonId, courseId);
    if (error) {
        toast.error(`Error al guardar el progreso: ${error.message}`);
        setIsSubmittingCompletion(false);
    } else {
        toast.success('¡Lección completada! Volviendo al curso...');
        navigate(`/course/${courseId}`, { state: { refresh: true } });
    }
  };

  const handleQuizComplete = (newAttempt: EvaluationAttempt) => {
    setLastAttempt(newAttempt);
    setAttemptsHistory(prev => [...prev, newAttempt]);
    setQuizViewState('result');
    if (newAttempt.passed) {
      handleActivityCompletion();
    }
  };

  const handleQuizRetry = () => {
    setLastAttempt(null);
    setQuizViewState('quiz');
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLessonContent = () => {
    if (!lesson) return <Alert>No hay contenido disponible para esta lección.</Alert>;
    
    if (isCompleted) {
        if (lesson.lesson_type === 'text') {
            return <TextSubmissionHandler lesson={lesson} onSubmissionComplete={() => {}} />;
        }
        return (
            <Alert variant='default' className='text-center'>
                <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <AlertTitle className='font-bold'>Lección Completada</AlertTitle>
                <AlertDescription>
                    Ya has completado esta lección. Puedes volver al curso.
                </AlertDescription>
            </Alert>
        );
    }

    if (isActivityFinished) {
        return (
            <Alert variant="default" className="bg-green-50 border-green-200 text-center">
                <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">¡Actividad Lista!</AlertTitle>
                <AlertDescription className="text-green-700">
                    Has completado la actividad de esta lección. Haz clic en el botón de abajo para guardar tu progreso.
                </AlertDescription>
            </Alert>
        );
    }

    switch (lesson.lesson_type) {
      case 'text':
        if(lesson.target_level === 'advanced'){
            const textContent = (lesson.content as TextContent)?.text;
            return <div className="prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: textContent || '' }} />;
        }
        return <TextSubmissionHandler lesson={lesson} onSubmissionComplete={handleActivityCompletion} />;
      
      case 'fill_in_the_blank':
        const ftbContent = lesson.content as FillInTheBlankContent;
        return <FillInTheBlankViewer content={ftbContent} onCompletion={handleActivityCompletion} />;

      case 'quiz':
        if (!lesson.evaluation) return <Alert>La evaluación para este quiz no está disponible.</Alert>;
        if (quizViewState === 'result' && lastAttempt) {
            const attemptsLeft = (lesson.evaluation.max_attempts || 1) - attemptsHistory.length;
            return <QuizResult attempt={lastAttempt} onNext={handleActivityCompletion} onRetry={handleQuizRetry} attemptsLeft={attemptsLeft} />
        }
        return <QuizRunner evaluation={lesson.evaluation as Evaluation} onQuizComplete={handleQuizComplete} />;

      default:
        const defaultContent = (lesson.content as TextContent)?.text;
        return <div className="prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: defaultContent || 'Contenido no disponible.' }} />;
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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Link to={`/course/${courseId}`} className="flex items-center text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Curso
          </Link>
        </div>
        <main className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <header className="mb-6 pb-4 border-b">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Duración estimada: {lesson.estimated_duration} min.</p>
          </header>
          
          {timeLeft !== null && !isCompleted && !isActivityFinished && (
            <div className={`text-center font-bold text-xl mb-6 p-2 rounded-md ${timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}`}>
              Tiempo restante: {formatTime(timeLeft)}
            </div>
          )}

          <div className="mb-8 min-h-[250px]">
            {renderLessonContent()}
          </div>
          
          {isActivityFinished && !isCompleted && (
            <footer className="flex flex-col sm:flex-row justify-end items-center pt-4 border-t mt-8">
                <Button 
                    onClick={handleMarkAsCompleted} 
                    variant="primary"
                    size="lg"
                    disabled={isCompleted || isSubmittingCompletion}
                    isLoading={isSubmittingCompletion}
                >
                <CheckCircle className="mr-2 h-5 w-5" />
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