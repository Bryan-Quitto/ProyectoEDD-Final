import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CourseService } from '../services/courseService';
import { EnrollmentService } from '../services/enrollmentService';
import { useAuth } from '../hooks/useAuth';
import type { CourseDetails, Module } from '@plataforma-educativa/types';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ModuleAccordion } from '../components/course/ModuleAccordion';
import { Clock, BarChart, BookUser } from 'lucide-react';
import toast from 'react-hot-toast';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !user) return;

    setIsLoading(true);
    setError(null);

    const fetchCourseData = CourseService.getCourseById(courseId);
    const fetchEnrolledCourses = CourseService.getEnrolledCourses(user.id);

    Promise.all([fetchCourseData, fetchEnrolledCourses])
      .then(([courseResponse, enrolledResponse]) => {
        if (courseResponse.data) {
          setCourse(courseResponse.data);
        } else {
          throw new Error(courseResponse.error?.message || 'No se pudo cargar el curso.');
        }

        if (enrolledResponse.data) {
          const isUserEnrolled = enrolledResponse.data.some(c => c.id === courseId);
          setIsEnrolled(isUserEnrolled);
        } else {
          throw new Error(enrolledResponse.error?.message || 'No se pudo verificar la inscripción.');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [courseId, user]);
  
  const handleEnroll = async () => {
    if (!courseId || !user) return;

    const promise = EnrollmentService.enrollInCourse(user.id, courseId);

    toast.promise(promise, {
      loading: 'Inscribiéndote...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        setIsEnrolled(true);
        return '¡Inscripción exitosa! Ya puedes empezar a aprender.';
      },
      error: (err) => err.message,
    });
  };

  if (isLoading) {
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
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>Curso no encontrado.</Alert>
      </div>
    );
  }
  
  const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;

  const renderEnrollmentButton = () => {
    if (user?.role !== 'student') return null;

    if (isEnrolled) {
        if (firstLessonId) {
             return (
                <Button size="lg" asChild className="w-full">
                    <Link to={`/course/${course.id}/lesson/${firstLessonId}`}>
                        Continuar Aprendizaje
                    </Link>
                </Button>
             )
        }
        return (
            <Button size="lg" disabled className="w-full">Contenido no disponible</Button>
        )
    }
    
    return (
        <Button size="lg" onClick={handleEnroll} className="w-full">
            Inscribirme ahora
        </Button>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 p-6 bg-white rounded-lg shadow-sm">
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Volver al Dashboard</Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-lg text-gray-600 mt-2">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center"><BookUser className="h-4 w-4 mr-1.5" /><span>{course.instructor_name || 'Profesor Desconocido'}</span></div>
            <span className="hidden md:inline">•</span>
            <div className="flex items-center"><BarChart className="h-4 w-4 mr-1.5" /><span>Nivel {course.difficulty_level}</span></div>
            <span className="hidden md:inline">•</span>
            <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /><span>{course.estimated_duration} horas</span></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contenido del Curso</h2>
              {isEnrolled || user?.role !== 'student' ? (
                <div className="space-y-3">
                  {course.modules && course.modules.length > 0 ? (
                    course.modules
                      .sort((a: Module, b: Module) => a.order_index - b.order_index)
                      .map((module) => (
                        <ModuleAccordion key={module.id} module={module} courseId={course!.id} />
                      ))
                  ) : (
                    <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
                      <p>El contenido de este curso estará disponible próximamente.</p>
                    </div>
                  )}
                </div>
              ) : (
                 <div className="text-center p-8 bg-white rounded-md border-2 border-dashed">
                    <p className="text-gray-600 font-medium">Inscríbete en el curso para ver el contenido completo.</p>
                </div>
              )}
            </div>
          </main>

          <aside>
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
              {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="rounded-lg mb-4 w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-6xl">🎓</span>
                </div>
              )}
              {renderEnrollmentButton()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;