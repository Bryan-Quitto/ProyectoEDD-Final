import React from 'react';
import type { Recommendation } from '../../types';
import { Button } from '../ui/Button';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onMarkAsRead: (id: string) => void;
  onMarkAsApplied: (id: string) => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onMarkAsRead,
  onMarkAsApplied,
  className = ''
}) => {
  const getPriorityInfo = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return { label: 'Alta', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'medium':
        return { label: 'Media', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'low':
        return { label: 'Baja', color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return { label: 'Normal', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('plan')) return '📚';
    if (typeLower.includes('practice') || typeLower.includes('practica')) return '💪';
    if (typeLower.includes('review') || typeLower.includes('repaso')) return '🔄';
    if (typeLower.includes('assessment') || typeLower.includes('evalua')) return '📝';
    if (typeLower.includes('break') || typeLower.includes('descanso')) return '☕';
    if (typeLower.includes('help') || typeLower.includes('ayuda')) return '🆘';
    return '💡';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'hace 1 día';
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const priorityInfo = getPriorityInfo(recommendation.priority);

  return (
    <div className={`recommendation-card bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${className} ${
      !recommendation.is_read ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
    }`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTypeIcon(recommendation.recommendation_type)}</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-base">
                {recommendation.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(recommendation.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!recommendation.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="No leída"></div>
            )}
            {recommendation.is_applied && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Aplicada"></div>
            )}
          </div>
        </div>

        <div className="mb-4 flex-grow">
          <p className="text-gray-700 leading-relaxed text-sm">
            {recommendation.description}
          </p>
          
          {recommendation.reason && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong className="font-medium text-gray-700">Razón:</strong> {recommendation.reason}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex space-x-2">
            {!recommendation.is_read && (
              <Button
                onClick={() => onMarkAsRead(recommendation.id)}
                variant="secondary"
                size="sm"
              >
                Leída
              </Button>
            )}
            
            {!recommendation.is_applied && (
              <Button
                onClick={() => onMarkAsApplied(recommendation.id)}
                variant="secondary"
                size="sm"
              >
                Aplicada
              </Button>
            )}
          </div>
          
          {recommendation.action_url && (
            <Button
              onClick={() => window.open(recommendation.action_url, '_blank')}
              variant="primary"
              size="sm"
            >
              Ir al Recurso
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};