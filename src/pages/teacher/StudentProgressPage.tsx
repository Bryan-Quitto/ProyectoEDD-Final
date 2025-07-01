import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CourseService } from '../../services/courseService';
import { UserService } from '../../services/userService';
import type { CourseDetails, User, Module, LessonWithSubmission } from '@plataforma-educativa/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { StudentProgressModuleAccordion } from '../../components/teacher/StudentProgressModuleAccordion';

type ModuleWithTrackedLessons = Omit<Module, 'lessons'> & {
  lessons: LessonWithSubmission[];
};

type CourseWithTrackedModules = Omit<CourseDetails, 'modules'> & {
  modules: ModuleWithTrackedLessons[];
};

const StudentProgressPage: React.FC = () => {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>();
  const [course, setCourse] = useState<CourseWithTrackedModules | null>(null);
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !studentId) return;

    setLoading(true);
    const fetchCourseWithProgress = CourseService.getCourseById(courseId, studentId);
    const fetchStudent = UserService.getUserById(studentId);

    Promise.all([fetchCourseWithProgress, fetchStudent])
      .then(([courseResponse, studentResponse]) => {
        if (courseResponse.data) {
          setCourse(courseResponse.data as CourseWithTrackedModules);
        } else {
          throw new Error(courseResponse.error?.message || 'Error al cargar el progreso del curso.');
        }

        if (studentResponse.data) {
          setStudent(studentResponse.data);
        } else {
          throw new Error(studentResponse.error?.message || 'Error al cargar los datos del estudiante.');
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId, studentId]);
  
  const handleGradeUpdate = (lessonId: string, updatedSubmission: any) => {
    if (!course) return;

    const newModules = course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => 
            lesson.id === lessonId ? { ...lesson, submission: updatedSubmission } : lesson
        )
    }));

    setCourse({ ...course, modules: newModules });
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!course || !student) {
    return <Alert>No se encontraron datos.</Alert>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <Link to={`/teacher/course/${courseId}/students`} className="text-sm text-blue-600 hover:underline flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver a la lista de estudiantes
          </Link>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Progreso de {student.full_name}</h1>
            <p className="text-lg text-gray-600">En el curso: {course.title}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center"><Mail className="h-4 w-4 mr-1.5" /><span>{student.email}</span></div>
              {student.phone_number && <><span className="hidden md:inline">•</span><div className="flex items-center"><Phone className="h-4 w-4 mr-1.5" /><span>{student.phone_number}</span></div></>}
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {course.modules.sort((a,b) => a.order_index - b.order_index).map(module => (
            <StudentProgressModuleAccordion 
              key={module.id} 
              module={module} 
              onGradeUpdate={handleGradeUpdate} 
            />
          ))}
        </main>
      </div>
    </div>
  );
};

export default StudentProgressPage;