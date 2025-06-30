import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRecommendations } from '../../hooks/useRecommendations';
import { recommendationService } from '../../services/recommendationService';
import { CourseService } from '../../services/courseService';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import type { Course } from '@plataforma-educativa/types';

interface RecommendationPanelProps {
  studentId: string;
  className?: string;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ studentId, className = '' }) => {
  const { recommendations, loading, error, fetchRecommendations, markAsRead, markAsApplied } = useRecommendations(studentId);

  const [filter, setFilter] = useState<'all' | 'unread' | 'applied'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  useEffect(() => {
    CourseService.getEnrolledCourses(studentId).then(res => {
      if (res.data) setEnrolledCourses(res.data);
    });
  }, [studentId]);

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

  const handleGenerateRecommendations = async () => {
    if (enrolledCourses.length === 0) {
      toast.error("Debes estar inscrito en al menos un curso para generar recomendaciones.");
      return;
    }
    
    setIsGenerating(true);
    const courseIdToGenerate = enrolledCourses[0].id;
    
    const result = await recommendationService.generateForCourse(studentId, courseIdToGenerate);

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success(`${result.data?.length || 0} nuevas recomendaciones generadas.`);
      fetchRecommendations();
    }
    setIsGenerating(false);
  };
  
  if (loading && recommendations.length === 0) {
    return <div className={`p-8 flex justify-center items-center ${className}`}><Spinner /> <span className="ml-2">Cargando...</span></div>;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Recomendaciones Personalizadas</h2>
          <Button onClick={handleGenerateRecommendations} disabled={isGenerating || enrolledCourses.length === 0}>
            {isGenerating ? <><Spinner size="sm" className="mr-2" /> Generando...</> : 'Generar Nuevas'}
          </Button>
        </div>

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

      <div className="p-6 min-h-[200px]">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <button onClick={fetchRecommendations} className="mt-2 text-sm font-semibold underline">Intentar de nuevo</button>
            </AlertDescription>
          </Alert>
        )}

        {!error && filteredRecommendations.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay recomendaciones</h3>
            <p className="text-gray-500 text-sm">Prueba a generar nuevas recomendaciones o cambia de filtro.</p>
          </div>
        )}

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