import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { CourseCard } from '../../components/course/CourseCard';
import { Spinner } from '../../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { CourseService } from '../../services/courseService';
import type { Course } from '@plataforma-educativa/types';
import { PlusCircle, Edit, Users } from 'lucide-react';

const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      CourseService.getCoursesByTeacher(user.id)
        .then(response => {
          if (response.data) {
            setCourses(response.data as Course[]);
          } else {
            setError(response.error?.message || 'No se pudieron cargar tus cursos.');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user?.id]);

  const renderCourses = () => {
    if (isLoading) {
      return <div className="text-center p-10"><Spinner size="lg" /></div>;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (courses.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="flex flex-col rounded-lg shadow-md overflow-hidden bg-white">
              <CourseCard course={course} className="border-none shadow-none rounded-b-none"/>
              <div className="flex justify-around bg-gray-50 p-1 border-t">
                 <Button variant="ghost" size="sm" asChild>
                   <Link to={`/admin/course/edit/${course.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600">
                     <Edit className="h-4 w-4" /> Editar
                   </Link>
                 </Button>
                 <Button variant="ghost" size="sm" asChild>
                   <Link to={`/teacher/course/${course.id}/students`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600">
                    <Users className="h-4 w-4" /> Estudiantes
                   </Link>
                 </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-gray-500">
          No has creado ningún curso todavía. ¡Crea el primero para empezar a enseñar!
        </p>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard del Profesor</h1>
          <p className="mt-2 text-lg text-gray-600">Bienvenido, {user?.full_name}.</p>
        </div>
        <Button asChild>
          <Link to="/admin/course/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Curso
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis Cursos</h2>
        {renderCourses()}
      </div>
    </div>
  );
};

export default TeacherDashboardPage;