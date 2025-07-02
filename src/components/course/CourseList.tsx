import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Asegúrate de que Link esté importado
import { CourseCard } from './CourseCard';
import type { Course } from '@plataforma-educativa/types';
import { CourseService } from '../../services/courseService';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';

interface CourseListProps {
  className?: string;
}

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced';
type SortBy = 'title' | 'created_at' | 'difficulty';

export const CourseList: React.FC<CourseListProps> = ({
  className = ''
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await CourseService.getAllCourses({
        search: searchTerm,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        is_active: 'all'
      });

      if (apiError) {
        throw new Error(apiError.message || 'Error al obtener los cursos');
      }
      
      if (data) {
        setCourses(data.data);
      } else {
        setCourses([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, difficultyFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadCourses();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [loadCourses]);

  const sortedCourses = [...courses]
    .sort((a, b) => {
      switch (sortBy) {
        case 'title': {
          return a.title.localeCompare(b.title);
        }
        case 'difficulty': {
          const difficultyOrder: { [key: string]: number } = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return (difficultyOrder[a.difficulty_level] || 0) - (difficultyOrder[b.difficulty_level] || 0);
        }
        case 'created_at':
        default: {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      }
    });

  if (loading) {
    return (
      <div className={`course-list ${className}`}>
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2 text-gray-600">Cargando cursos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`course-list ${className}`}>
        <div className="p-8 text-center">
          <Alert variant="destructive">{error}</Alert>
          <button
            onClick={loadCourses}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-list ${className}`}>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Catálogo de Cursos</h2>
          <div className="text-sm text-gray-600">
            {sortedCourses.length} cursos encontrados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as Difficulty)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las dificultades</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Más recientes</option>
            <option value="title">Alfabético</option>
            <option value="difficulty">Dificultad</option>
          </select>
        </div>
      </div>

      {sortedCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No se encontraron cursos
          </h3>
          <p className="text-gray-500">
            Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCourses.map((course) => (
            // --- SECCIÓN MODIFICADA ---
            <Link key={course.id} to={`/course/${course.id}`} className="block h-full">
              <CourseCard
                course={course}
                className="h-full"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};