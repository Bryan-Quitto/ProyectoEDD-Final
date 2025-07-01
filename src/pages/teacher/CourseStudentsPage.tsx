import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EnrollmentService } from '../../services/enrollmentService';
import { CourseService } from '../../services/courseService';
import type { User, Course } from '@plataforma-educativa/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';

const CourseStudentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    const fetchStudents = EnrollmentService.getStudentsByCourse(courseId);
    const fetchCourse = CourseService.getCourseById(courseId);

    Promise.all([fetchStudents, fetchCourse])
      .then(([studentsResponse, courseResponse]) => {
        if (studentsResponse.data) {
          setStudents(studentsResponse.data);
        } else {
          throw new Error(studentsResponse.error?.message || 'Error al cargar estudiantes.');
        }

        if (courseResponse.data) {
          setCourse(courseResponse.data);
        } else {
          throw new Error(courseResponse.error?.message || 'Error al cargar datos del curso.');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);
  
  const backLink = useMemo(() => {
      if (currentUser?.role === 'admin') return '/admin/dashboard';
      if (currentUser?.role === 'teacher') return '/teacher/dashboard';
      return '/';
  }, [currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={backLink} className="p-2 rounded-md hover:bg-gray-100">
           <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Estudiantes Inscritos</h1>
            <p className="text-lg text-gray-600">Curso: {course?.title || 'Cargando...'}</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Estudiante</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.length > 0 ? students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/teacher/course/${courseId}/student/${student.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Ver Progreso
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No hay estudiantes inscritos en este curso todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseStudentsPage;