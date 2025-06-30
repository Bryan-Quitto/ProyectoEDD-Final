import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CourseService } from '../services/courseService';
import { lessonService } from '../services/lessonService';
import { evaluationService } from '../services/evaluationService';
import { studentProgressService } from '../services/studentProgressService';
import type { Lesson, CourseDetails, Module, EvaluationAttempt, Evaluation } from '@plataforma-educativa/types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResult } from '../components/quiz/QuizResult';
import { useAuth } from '../hooks/useAuth';

const AttemptsHistory: React.FC<{attempts: EvaluationAttempt[]}> = ({ attempts }) => (
  <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
    <h3 className="font-semibold mb-3 text-gray-800">Historial de Intentos</h3>
    {attempts.length === 0 ? (
      <p className="text-sm text-gray-500">Aún no has realizado ningún intento.</p>
    ) : (
      <ul className="space-y-2 text-sm">
        {attempts.map(att => (
          <li key={att.id} className={`flex justify-between items-center p-2 rounded ${att.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>Intento #{att.attempt_number}</span>
            <span className="font-bold">{att.percentage}% ({att.score}/{att.max_score})</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewState, setViewState] = useState<'loading' | 'content' | 'quiz' | 'result' | 'no_attempts'>('loading');
  const [attemptsHistory, setAttemptsHistory] = useState<EvaluationAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);
  const [moduleEvaluation, setModuleEvaluation] = useState<Evaluation | null>(null);

  const fetchLessonData = useCallback(async () => {
    if (!lessonId || !courseId || !user) {
      setError("Faltan datos para cargar la lección.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [lessonResponse, courseResponse] = await Promise.all([
        lessonService.getLessonById(lessonId),
        CourseService.getCourseById(courseId),
      ]);

      if (lessonResponse.error || !lessonResponse.data) throw new Error(lessonResponse.error?.message || 'Lección no encontrada.');
      const currentLesson = lessonResponse.data;
      setLesson(currentLesson);
      
      if (courseResponse.error || !courseResponse.data) throw new Error(courseResponse.error?.message || 'Curso no encontrado.');
      setCourse(courseResponse.data);

      const { data: moduleEval } = await evaluationService.getByModuleId(currentLesson.module_id);
      setModuleEvaluation(moduleEval);

      if (currentLesson.lesson_type === 'quiz' && currentLesson.evaluation?.id) {
        const historyResponse = await evaluationService.getAttemptsHistory(currentLesson.evaluation.id, user.id);
        if (historyResponse.error || !historyResponse.data) throw new Error(historyResponse.error?.message || 'No se pudo cargar el historial.');
        
        const history = historyResponse.data;
        setAttemptsHistory(history);
        
        const maxAttempts = currentLesson.evaluation.max_attempts ?? 1;
        const attemptsLeft = maxAttempts - history.length;
        const hasPassed = history.some(att => att.passed);

        if (hasPassed) {
            setLastAttempt(history.find(att => att.passed) || history[history.length - 1]);
            setViewState('result');
        } else if (attemptsLeft > 0) {
            setViewState('quiz');
        } else {
            setLastAttempt(history[history.length - 1]);
            setViewState('no_attempts');
        }
      } else {
        setViewState('content');
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, courseId, user]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  const navigationInfo = useMemo(() => {
    if (!course || !lesson) return { prevLessonId: null, nextLessonId: null, isLastInModule: false };
    
    const currentModule = course.modules.find(m => m.id === lesson.module_id);
    if (!currentModule) return { prevLessonId: null, nextLessonId: null, isLastInModule: false };

    const moduleLessons = (currentModule.lessons || []).sort((a, b) => a.order_index - b.order_index);
    const currentLessonIndexInModule = moduleLessons.findIndex(l => l.id === lesson.id);
    const isLastInModule = currentLessonIndexInModule === moduleLessons.length - 1;

    const allLessons = course.modules?.flatMap(m => m.lessons || []).sort((a, b) => a.order_index - b.order_index) || [];
    const currentGlobalIndex = allLessons.findIndex(l => l.id === lesson.id);
    
    return {
      prevLessonId: currentGlobalIndex > 0 ? allLessons[currentGlobalIndex - 1].id : null,
      nextLessonId: currentGlobalIndex < allLessons.length - 1 ? allLessons[currentGlobalIndex + 1].id : null,
      isLastInModule,
    };
  }, [course, lesson]);
  
  const handleQuizComplete = (newAttempt: EvaluationAttempt) => {
    setLastAttempt(newAttempt);
    setAttemptsHistory(prev => [...prev, newAttempt]);
    toast.success('Nuevas recomendaciones podrían estar disponibles en tu panel.');
    setViewState('result');
  };

  const handleRetry = () => {
    setLastAttempt(null);
    setViewState('quiz');
  }
  
  const handleContinue = async () => {
    if (lesson && lesson.lesson_type !== 'quiz' && lessonId) {
        await studentProgressService.markLessonAsCompleted(lessonId);
        toast.success("Lección completada!");
    }
    
    if (navigationInfo.isLastInModule && moduleEvaluation) {
      navigate(`/course/${courseId}/module/${lesson?.module_id}/evaluation`);
    } else if (navigationInfo.nextLessonId) {
      navigate(`/course/${courseId}/lesson/${navigationInfo.nextLessonId}`);
    } else {
      toast('¡Felicidades! Has completado el curso.', { icon: '🎉' });
      navigate(`/course/${courseId}`);
    }
  };

  const renderContent = () => {
    if (lesson?.lesson_type !== 'quiz' || !lesson.evaluation) {
        if (lesson?.lesson_type === 'video' && lesson.content_url && lesson.content_url.includes('youtube.com')) {
          try {
            const videoId = new URL(lesson.content_url).searchParams.get('v');
            if (!videoId) throw new Error("URL de YouTube no válida.");
            return <div className="relative pt-[56.25%]"><iframe src={`https://www.youtube.com/embed/${videoId}`} title={lesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute top-0 left-0 w-full h-full rounded-lg"></iframe></div>;
          } catch {
             return <Alert variant="destructive">La URL del video de YouTube no es válida.</Alert>
          }
        }
        if (!lesson?.content_url && lesson?.content) return <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />;
        if (lesson?.content_url) return <div className="text-center p-8 bg-gray-100 rounded-lg"><p className="mb-4">Este tipo de contenido se debe abrir en una nueva pestaña.</p><Button onClick={() => window.open(lesson.content_url, '_blank')}>Abrir Contenido</Button></div>;
        return <Alert>No hay contenido disponible para esta lección.</Alert>
    }

    const maxAttempts = lesson.evaluation.max_attempts ?? 1;
    const attemptsLeft = maxAttempts - attemptsHistory.length;

    switch (viewState) {
        case 'quiz':
            return <QuizRunner evaluation={lesson.evaluation as Evaluation} onQuizComplete={handleQuizComplete} />;
        case 'result':
            if (!lastAttempt) return <Alert>No se pudo cargar el resultado del intento.</Alert>;
            return <QuizResult attempt={lastAttempt} onNext={handleContinue} onRetry={handleRetry} attemptsLeft={attemptsLeft} />;
        case 'no_attempts':
             return (
                <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                    <Info className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-xl font-semibold text-red-800">No te quedan más intentos</h3>
                    <p className="mt-2 text-sm text-red-700">Has utilizado los {maxAttempts} intentos permitidos para esta evaluación. Por favor, contacta a tu instructor si necesitas ayuda.</p>
                    {lastAttempt && <div className="mt-4 text-sm"><strong>Último resultado:</strong> {lastAttempt.percentage}%</div>}
                    <Button onClick={handleContinue} className="mt-6">Ir a la Siguiente Lección</Button>
                </div>
            );
        default:
            return <Alert>Cargando estado de la evaluación...</Alert>;
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><Alert variant="destructive">{error}</Alert></div>;
  }

  if (!lesson || !course) {
    return <div className="container mx-auto px-4 py-8"><Alert>No se pudo cargar la lección.</Alert></div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/course/${courseId}`} className="text-sm text-blue-600 hover:underline">← Volver a {course.title}</Link>
        </div>
        <main className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Duración estimada: {lesson.estimated_duration} min.</p>
          </header>
          <div className="mb-8 min-h-[300px]">{renderContent()}</div>
          {lesson.lesson_type === 'quiz' && lesson.evaluation && <AttemptsHistory attempts={attemptsHistory} />}
          {lesson.lesson_type !== 'quiz' && (
            <footer className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t mt-8">
              <Button onClick={() => navigationInfo.prevLessonId && navigate(`/course/${courseId}/lesson/${navigationInfo.prevLessonId}`)} disabled={!navigationInfo.prevLessonId} variant="secondary"><ArrowLeft className="mr-2 h-4 w-4" /> Anterior</Button>
              <Button onClick={handleContinue} variant="primary" className="my-4 sm:my-0"><CheckCircle className="mr-2 h-4 w-4" />
                {navigationInfo.isLastInModule && moduleEvaluation ? 'Ir a la Evaluación del Módulo' : 'Completar y Siguiente'}
              </Button>
              <Button onClick={() => navigationInfo.nextLessonId && navigate(`/course/${courseId}/lesson/${navigationInfo.nextLessonId}`)} disabled={navigationInfo.isLastInModule || !navigationInfo.nextLessonId} variant="secondary">Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default LessonViewPage;