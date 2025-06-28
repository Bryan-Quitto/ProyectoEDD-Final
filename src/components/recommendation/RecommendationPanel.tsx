import React, { useState, useEffect } from 'react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationPanelProps {
  studentId: string;
  className?: string;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  studentId,
  className = ''
}) => {
  const {
    recommendations,
    loading,
    error,
    generateRecommendations,
    fetchRecommendations,
    markAsRead,
    markAsApplied,
  } = useRecommendations(studentId);

  const [filter, setFilter] = useState<'all' | 'unread' | 'applied'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    applied: 0
  });

  useEffect(() => {
    const total = recommendations.length;
    const unread = recommendations.filter(r => !r.is_read).length;
    const applied = recommendations.filter(r => r.is_applied).length;
    
    setStats({ total, unread, applied });
  }, [recommendations]);

  const filteredRecommendations = recommendations.filter(recommendation => {
    switch (filter) {
      case 'unread':
        return !recommendation.is_read;
      case 'applied':
        return recommendation.is_applied;
      default:
        return true;
    }
  });

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      await generateRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsRead = async (recommendationId: string) => {
    try {
      await markAsRead(recommendationId);
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
    }
  };

  const handleMarkAsApplied = async (recommendationId: string) => {
    try {
      await markAsApplied(recommendationId);
    } catch (error) {
      console.error('Error marking recommendation as applied:', error);
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className={`recommendation-panel ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando recomendaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`recommendation-panel bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Recomendaciones Personalizadas</h2>
          <button
            onClick={handleGenerateRecommendations}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Generando...
              </>
            ) : (
              'Generar Nuevas'
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">Sin Leer</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
            <div className="text-sm text-gray-600">Aplicadas</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sin Leer ({stats.unread})
          </button>
          <button
            onClick={() => setFilter('applied')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'applied'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aplicadas ({stats.applied})
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
            <button
              onClick={fetchRecommendations}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {filter === 'all' 
                ? 'No hay recomendaciones disponibles'
                : filter === 'unread'
                ? 'No hay recomendaciones sin leer'
                : 'No hay recomendaciones aplicadas'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all'
                ? 'Genera nuevas recomendaciones basadas en tu progreso actual.'
                : 'Cambia el filtro para ver otras recomendaciones.'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generando...' : 'Generar Recomendaciones'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onMarkAsRead={() => handleMarkAsRead(recommendation.id)}
                onMarkAsApplied={() => handleMarkAsApplied(recommendation.id)}
              />
            ))}
          </div>
        )}

        {loading && recommendations.length > 0 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Actualizando recomendaciones...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};