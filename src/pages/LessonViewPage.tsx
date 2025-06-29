import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CourseService } from '../services/courseService';
import { lessonService } from '../services/lessonService';
import type { Lesson, CourseDetails, Module } from '@plataforma-educativa/types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navLinks, setNavLinks] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId || !courseId) {
        setError("IDs de curso o lección no válidos.");
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

        if (lessonResponse.data) {
          setLesson(lessonResponse.data);
        } else {
          throw new Error('Lección no encontrada.');
        }
        
        const courseData = courseResponse.data as CourseDetails | null;

        if (courseData) {
          setCourse(courseData);
          const allLessons: Lesson[] = courseData.modules
            ?.flatMap((m: Module) => m.lessons || [])
            .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index) || [];

          const currentIndex = allLessons.findIndex(l => l.id === lessonId);
          
          setNavLinks({
            prev: currentIndex > 0 ? allLessons[currentIndex - 1].id : null,
            next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null,
          });
        } else {
          throw new Error('Curso no encontrado.');
        }

      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Error al cargar el contenido.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
       <div className="container mx-auto px-4 py-8">
        <Alert>No se pudo cargar la lección.</Alert>
      </div>
    );
  }

  const renderContent = () => {
    if (!lesson.content_url && lesson.content) {
      return <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />;
    }
    
    if (lesson.lesson_type === 'video' && lesson.content_url && lesson.content_url.includes('youtube.com')) {
      try {
        const videoId = new URL(lesson.content_url).searchParams.get('v');
        if (!videoId) throw new Error("URL de YouTube no válida.");
        return (
          <div className="relative" style={{ paddingTop: '56.25%' }}>
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}`} 
              title={lesson.title} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-lg"
            ></iframe>
          </div>
        );
      } catch {
         return <Alert variant="destructive">La URL del video de YouTube no es válida.</Alert>
      }
    }

    if (lesson.content_url) {
      return (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="mb-4">Este tipo de contenido se debe abrir en una nueva pestaña.</p>
          <Button onClick={() => window.open(lesson.content_url, '_blank')}>
            Abrir Contenido
          </Button>
        </div>
      );
    }

    return <Alert>No hay contenido disponible para esta lección.</Alert>
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/courses/${courseId}`} className="text-sm text-blue-600 hover:underline">
            ← Volver a {course.title}
          </Link>
        </div>

        <main className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Duración estimada: {lesson.estimated_duration} min.</p>
          </header>

          <div className="mb-8 min-h-[300px]">
              {renderContent()}
          </div>

          <footer className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t mt-8">
            <Button
              onClick={() => navLinks.prev && navigate(`/courses/${courseId}/lessons/${navLinks.prev}`)}
              disabled={!navLinks.prev}
              variant="secondary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>

            <Button
              onClick={() => {
                // Lógica para marcar como completada
              }}
              variant="primary"
              className="my-4 sm:my-0"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como completada
            </Button>

            <Button
              onClick={() => navLinks.next && navigate(`/courses/${courseId}/lessons/${navLinks.next}`)}
              disabled={!navLinks.next}
              variant="secondary"
            >
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LessonViewPage;