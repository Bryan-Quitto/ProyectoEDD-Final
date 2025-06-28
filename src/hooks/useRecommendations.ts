import { useState, useEffect } from 'react';
import type { Recommendation } from '../types';
import { RecommendationService } from '../services/recommendationService';

export const useRecommendations = (studentId: string) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await RecommendationService.getRecommendations(studentId);
      if (response.success) {
        setRecommendations(response.data);
      } else {
        setError(response.error || 'Error al cargar recomendaciones');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await RecommendationService.generateRecommendations(studentId);
      if (response.success) {
        setRecommendations(response.data);
      } else {
        setError(response.error || 'Error al generar recomendaciones');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (recommendationId: string) => {
    try {
      const response = await RecommendationService.markAsRead(recommendationId);
      if (response.success) {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, is_read: true }
              : rec
          )
        );
      }
    } catch (err) {
      setError('Error al marcar como leída');
    }
  };

  const markAsApplied = async (recommendationId: string) => {
    try {
      const response = await RecommendationService.markAsApplied(recommendationId);
      if (response.success) {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, is_applied: true }
              : rec
          )
        );
      }
    } catch (err) {
      setError('Error al marcar como aplicada');
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchRecommendations();
    }
  }, [studentId]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    generateRecommendations,
    markAsRead,
    markAsApplied,
  };
};