import React from 'react';
import type { Recommendation } from '../../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onMarkAsRead: () => void;
  onMarkAsApplied: () => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onMarkAsRead,
  onMarkAsApplied,
  className = ''
}) => {
  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Type icon mapping
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'study_plan':
      case 'plan_estudio':
        return '📚';
      case 'practice':
      case 'practica':
        return '💪';
      case 'review':
      case 'repaso':
        return '🔄';
      case 'assessment':
      case 'evaluacion':
        return '📝';
      case 'break':
      case 'descanso':
        return '☕';
      case 'help':
      case 'ayuda':
        return '🆘';
      default:
        return '💡';
    }
  };

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleActionClick = () => {
    if (recommendation.action_url) {
      window.open(recommendation.action_url, '_blank');
    }
  };

  return (
    <div className={`recommendation-card bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${className} ${
      !recommendation.is_read ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {recommendation.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  getPriorityColor(recommendation.priority)
                }`}>
                  {recommendation.priority === 'high' ? 'Alta' :
                   recommendation.priority === 'medium' ? 'Media' :
                   recommendation.priority === 'low' ? 'Baja' :
                   recommendation.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(recommendation.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            {!recommendation.is_read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" title="No leída"></span>
            )}
            {recommendation.is_applied && (
              <span className="text-green-500 text-sm" title="Aplicada">✓</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {recommendation.content}
          </p>
          
          {recommendation.reason && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Razón:</strong> {recommendation.reason}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!recommendation.is_read && (
              <button
                onClick={onMarkAsRead}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Marcar como leída
              </button>
            )}
            
            {!recommendation.is_applied && (
              <button
                onClick={onMarkAsApplied}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                Marcar como aplicada
              </button>
            )}
          </div>
          
          {recommendation.action_url && (
            <button
              onClick={handleActionClick}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <span>Ir al recurso</span>
              <span>→</span>
            </button>
          )}
        </div>

        {/* Metadata */}
        {(recommendation.course_id || recommendation.lesson_id) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {recommendation.course_id && (
                <span>📖 Curso ID: {recommendation.course_id}</span>
              )}
              {recommendation.lesson_id && (
                <span>📄 Lección ID: {recommendation.lesson_id}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};