import React, { useState } from 'react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';
import { Spinner } from '../ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';

interface RecommendationPanelProps {
  studentId: string;
  className?: string;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ studentId, className = '' }) => {
  const { recommendations, loading, error, fetchRecommendations, markAsRead, markAsApplied } = useRecommendations(studentId);

  const [filter, setFilter] = useState<'all' | 'unread' | 'applied'>('all');

  const stats = {
    total: recommendations.length,
    unread: recommendations.filter(r => !r.is_read).length,
    applied: recommendations.filter(r => r.is_applied).length
  };

  const filteredRecommendations = recommendations.filter(recommendation => {
    if (filter === 'unread') return !recommendation.is_read;
    if (filter === 'applied') return recommendation.is_applied;
    return true;
  });

  if (loading && recommendations.length === 0) {
    return <div className={`p-8 flex justify-center items-center ${className}`}><Spinner /> <span className="ml-2">Cargando...</span></div>;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recomendaciones Personalizadas</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-600">Total</div></div>
          <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{stats.unread}</div><div className="text-sm text-gray-600">Sin Leer</div></div>
          <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{stats.applied}</div><div className="text-sm text-gray-600">Aplicadas</div></div>
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Todas ({stats.total})</button>
          <button onClick={() => setFilter('unread')} className={`px-3 py-1 rounded-full text-sm ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Sin Leer ({stats.unread})</button>
          <button onClick={() => setFilter('applied')} className={`px-3 py-1 rounded-full text-sm ${filter === 'applied' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Aplicadas ({stats.applied})</button>
        </div>
      </div>

      <div className="p-6 min-h-[200px] max-h-[400px] overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <button onClick={fetchRecommendations} className="mt-2 text-sm font-semibold underline">Intentar de nuevo</button>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredRecommendations.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay recomendaciones</h3>
            <p className="text-gray-500 text-sm">Tu progreso se analiza automáticamente para darte consejos.</p>
          </div>
        )}
        
        {loading && <div className="flex justify-center"><Spinner /></div>}

        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onMarkAsRead={() => markAsRead(recommendation.id)}
              onMarkAsApplied={() => markAsApplied(recommendation.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};