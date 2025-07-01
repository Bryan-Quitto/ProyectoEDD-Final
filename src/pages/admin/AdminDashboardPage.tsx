import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CourseService } from '../../services/courseService';
import type { Course } from '@plataforma-educativa/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Edit, Users } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      const response = await CourseService.getAllCourses({ limit: 100 });
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setCourses(response.data.data || []);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona todos los cursos y el contenido de la plataforma.</p>
        </div>
        <Link to="/manage/course/create">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Crear Nuevo Curso
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center p-10"><Spinner size="lg" /></div>
      )}

      {error && (
        <Alert variant="destructive" title="Error">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Todos los Cursos del Sistema</h2>
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.instructor_name || 'No asignado'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {course.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {/* --- SECCIÓN MODIFICADA --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/students`} title="Ver todos los Estudiantes">
                             <Users className="h-5 w-5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/manage/course/edit/${course.id}`} title="Editar Curso">
                             <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No hay cursos en el sistema. ¡Crea el primero!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;