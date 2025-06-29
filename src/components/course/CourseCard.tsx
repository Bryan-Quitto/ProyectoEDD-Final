import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '@plataforma-educativa/types';

interface CourseCardProps {
  course: Course;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = ''
}) => {
  const progressPercentage = (course.total_lessons || 0) > 0 
    ? Math.round(((course.completed_lessons || 0) / (course.total_lessons || 1)) * 100)
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
      case 'avanzado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Link 
      to={`/courses/${course.id}`}
      state={{ course }}
      className={`course-card flex flex-col bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 ${className}`}
    >
      <div className="relative">
        {course.image_url ? (
          <img 
            src={course.image_url} 
            alt={course.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center">
            <span className="text-white text-6xl">📚</span>
          </div>
        )}
        
        {progressPercentage > 0 && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1">
            <span className="text-xs font-medium text-gray-700">
              {progressPercentage}%
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {course.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              getDifficultyColor(course.difficulty_level)
            }`}>
              {course.difficulty_level === 'beginner' ? 'Principiante' :
               course.difficulty_level === 'intermediate' ? 'Intermedio' :
               course.difficulty_level === 'advanced' ? 'Avanzado' :
               course.difficulty_level}
            </span>
            
            {course.estimated_duration && (
              <span className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">⏱️</span>
                {formatDuration(course.estimated_duration)}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {course.description}
        </p>

        {(course.total_lessons || 0) > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{course.completed_lessons || 0}/{course.total_lessons || 0} lecciones</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center space-x-3">
            {(course.total_lessons || 0) > 0 && (
              <span className="flex items-center">
                <span className="mr-1">📄</span>
                {course.total_lessons} lecciones
              </span>
            )}
            
            {course.instructor_name && (
              <span className="flex items-center">
                <span className="mr-1">👨‍🏫</span>
                {course.instructor_name}
              </span>
            )}
          </div>
          
          <span>{formatDate(course.created_at)}</span>
        </div>

        {!course.is_active && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <span className="text-xs text-yellow-800">⚠️ Curso no disponible</span>
          </div>
        )}
      </div>
    </Link>
  );
};