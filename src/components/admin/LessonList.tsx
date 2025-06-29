import React, { useState, useEffect, useCallback } from 'react';
import type { Lesson } from '@plataforma-educativa/types';
import { lessonService } from '../../services/lessonService';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { LessonItem } from './LessonItem';
import { AddLessonForm } from './AddLessonForm';

interface LessonListProps {
  moduleId: string;
}

export const LessonList: React.FC<LessonListProps> = ({ moduleId }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    const response = await lessonService.getLessonsByModule(moduleId);
    if (response.data) {
      setLessons(response.data.sort((a, b) => a.order_index - b.order_index));
      setError(null);
    } else {
      setError(response.error?.message || 'No se pudieron cargar las lecciones.');
    }
    setIsLoading(false);
  }, [moduleId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleLessonAdded = (newLesson: Lesson) => {
    setLessons(prev => [...prev, newLesson].sort((a, b) => a.order_index - b.order_index));
  };
  
  const handleLessonUpdated = (updated: Lesson) => {
    setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleLessonDeleted = (id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Spinner /></div>;
  }
  
  if (error) {
    return <Alert variant="destructive" title="Error">{error}</Alert>;
  }

  const nextOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {lessons.length > 0 ? (
          lessons.map(lesson => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              onLessonUpdated={handleLessonUpdated}
              onLessonDeleted={handleLessonDeleted}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Este módulo no tiene lecciones aún.</p>
        )}
      </div>
      <AddLessonForm
        moduleId={moduleId}
        onLessonAdded={handleLessonAdded}
        nextOrderIndex={nextOrderIndex}
      />
    </div>
  );
};