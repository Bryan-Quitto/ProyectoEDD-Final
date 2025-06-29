import { useState, useEffect, useCallback } from 'react';
import type { Recommendation} from '@plataforma-educativa/types';
import { RecommendationService } from '../services/recommendationService';

export const useRecommendations = (studentId?: string) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await RecommendationService.getRecommendations(studentId);
      if (apiError) {
        throw new Error(apiError.message);
      }
      setRecommendations(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const generateRecommendations = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await RecommendationService.generateRecommendations(studentId);
      if (apiError) {
        throw new Error(apiError.message);
      }
      setRecommendations(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const markAsRead = useCallback(async (recommendationId: string) => {
    try {
      const { error: apiError } = await RecommendationService.markAsRead(recommendationId);
      if (apiError) {
        throw new Error(apiError.message);
      }
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true }
            : rec
        )
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al marcar como leída';
      setError(message);
      console.error(err);
    }
  }, []);

  const markAsApplied = useCallback(async (recommendationId: string) => {
    try {
      const { error: apiError } = await RecommendationService.markAsApplied(recommendationId);
      if (apiError) {
        throw new Error(apiError.message);
      }
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_applied: true }
            : rec
        )
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al marcar como aplicada';
      setError(message);
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

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