import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CourseService } from '../services/courseService';
import type { CourseDetails, Course } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ModuleAccordion } from '../components/course/ModuleAccordion';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  
  const initialCourse = location.state?.course as Course | null;
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        setError("ID del curso no especificado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: apiError } = await CourseService.getCourseById(courseId);
        
        if (apiError) {
          throw new Error(apiError.message || 'Error en la respuesta del servidor.');
        }

        if (data) {
          setCourse(data as CourseDetails);
        } else {
          setError('No se encontró el curso especificado.');
        }
      } catch (err: any) {
        setError('No se pudo cargar la información del curso. Por favor, inténtalo de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const displayCourse = course || initialCourse;

  if (loading && !displayCourse) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
        <span className="ml-4 text-gray-600">Cargando detalles del curso...</span>
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

  if (!displayCourse) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Alert>Curso no encontrado.</Alert>
        </div>
    );
  }
  
  const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 p-6 bg-white rounded-lg shadow-sm">
          <Link to="/courses" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Volver al catálogo</Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{displayCourse.title}</h1>
          <p className="text-lg text-gray-600 mt-2">{displayCourse.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span>
              Por <span className="font-semibold text-gray-700">{displayCourse.instructor_name || 'Profesor Desconocido'}</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span>Dificultad: <span className="font-semibold text-gray-700 capitalize">{displayCourse.difficulty_level}</span></span>
            <span className="hidden md:inline">•</span>
            <span>Duración estimada: <span className="font-semibold text-gray-700">{displayCourse.estimated_duration} min.</span></span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contenido del Curso</h2>
              <div className="space-y-3">
                {loading && !course && (
                    <div className="flex justify-center items-center p-8">
                        <Spinner />
                        <span className="ml-2">Cargando módulos...</span>
                    </div>
                )}
                {course && course.modules && course.modules.length > 0 ? (
                  course.modules
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((module) => (
                      <ModuleAccordion key={module.id} module={module} courseId={course!.id} />
                    ))
                ) : (
                  !loading && (
                    <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
                        <p>El contenido de este curso estará disponible próximamente.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </main>

          <aside>
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
              {displayCourse.image_url ? (
                  <img src={displayCourse.image_url} alt={displayCourse.title} className="rounded-lg mb-4 w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-6xl">🎓</span>
                </div>
              )}
              {firstLessonId ? (
                <Link
                  to={`/courses/${displayCourse.id}/lessons/${firstLessonId}`}
                  className="w-full text-center inline-block bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md hover:shadow-lg"
                >
                  Empezar Curso
                </Link>
              ) : (
                 <button
                  disabled
                  className="w-full text-center inline-block bg-gray-400 text-white font-bold py-3 px-4 rounded-lg cursor-not-allowed"
                >
                  Contenido no disponible
                </button>
              )}
              <div className="mt-6 text-sm">
                <h3 className="font-semibold text-gray-700 mb-3">Detalles del curso:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex justify-between"><span>Lecciones:</span> <strong>{course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || '...'}</strong></li>
                  <li className="flex justify-between"><span>Módulos:</span> <strong>{course?.modules?.length || '...'}</strong></li>
                  <li className="flex justify-between"><span>Evaluaciones:</span> <strong>{course?.modules?.reduce((acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.evaluations?.length || 0), 0) || 0), 0) || '...'}</strong></li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;