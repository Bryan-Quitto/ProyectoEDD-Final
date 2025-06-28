import React, { useState, useEffect } from 'react';
import { CourseCard } from './CourseCard';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';

interface CourseListProps {
  onCourseSelect?: (course: Course) => void;
  className?: string;
}

export const CourseList: React.FC<CourseListProps> = ({
  onCourseSelect,
  className = ''
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'difficulty'>('created_at');

  // Load courses
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      setError('Error al cargar los cursos');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort courses
  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      const isActive = course.is_active;
      
      return matchesSearch && matchesDifficulty && isActive;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleCourseClick = (course: Course) => {
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };

  if (loading) {
    return (
      <div className={`course-list ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando cursos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`course-list ${className}`}>
        <div className="p-8 text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button
            onClick={loadCourses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-list ${className}`}>
      {/* Header and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Catálogo de Cursos</h2>
          <div className="text-sm text-gray-600">
            {filteredAndSortedCourses.length} de {courses.length} cursos
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las dificultades</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'created_at' | 'difficulty')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Más recientes</option>
            <option value="title">Alfabético</option>
            <option value="difficulty">Dificultad</option>
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {filteredAndSortedCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No se encontraron cursos
          </h3>
          <p className="text-gray-500">
            {searchTerm || difficultyFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda.'
              : 'No hay cursos disponibles en este momento.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => handleCourseClick(course)}
              className="h-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};