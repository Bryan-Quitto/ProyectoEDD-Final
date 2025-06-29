import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CourseService } from '../../services/courseService';
import type { Course } from '@plataforma-educativa/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';

type PartialCourse = Pick<Course, 'id' | 'title' | 'is_active' | 'created_at'>;

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<PartialCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      const response = await CourseService.getCoursesByTeacher(user.id);
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setCourses(response.data || []);
      }
      setLoading(false);
    };

    fetchCourses();
  }, [user]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona tus cursos y contenidos.</p>
        </div>
        <Link to="/admin/course/create">
          <Button>
            Crear Nuevo Curso
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center">
          <Spinner />
        </div>
      )}

      {error && (
        <Alert variant="destructive" title="Error">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Mis Cursos</h2>
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {course.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(course.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/admin/course/edit/${course.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Aún no has creado ningún curso.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;