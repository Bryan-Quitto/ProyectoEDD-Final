import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '@plataforma-educativa/types';
import { CourseService } from '../../services/courseService';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Edit, Users, Trash } from 'lucide-react';

export const AdminCourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadCourses = useCallback(async () => {
    setLoading(true);
    const response = await CourseService.getAllCourses({ limit: 100 });
    if (response.data) {
      setCourses(response.data.data);
    } else {
      setError(response.error?.message || "Error al cargar los cursos");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  if (loading) return <div className="text-center p-8"><Spinner /></div>;
  if (error) return <div className="p-8 text-center"><Alert variant="destructive">{error}</Alert></div>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map((course) => (
            <tr key={course.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{course.title}</div>
                <div className="text-sm text-gray-500 capitalize">{course.difficulty_level}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.instructor_name || 'No asignado'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {course.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                <Button variant="ghost" size="icon" asChild title="Ver Estudiantes">
                  <Link to={`/teacher/course/${course.id}/students`}><Users className="h-4 w-4 text-blue-600" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="Editar Curso">
                  <Link to={`/admin/course/edit/${course.id}`}><Edit className="h-4 w-4 text-gray-600" /></Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};