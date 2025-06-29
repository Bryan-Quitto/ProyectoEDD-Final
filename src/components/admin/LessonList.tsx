import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      const response = await lessonService.getLessonsByModule(moduleId);
      if (response.data) {
        setLessons(response.data);
      } else {
        setError(response.error?.message || 'No se pudieron cargar las lecciones.');
      }
      setIsLoading(false);
    };
    fetchLessons();
  }, [moduleId]);

  const handleLessonAdded = (newLesson: Lesson) => setLessons(prev => [...prev, newLesson]);
  const handleLessonUpdated = (updated: Lesson) => setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
  const handleLessonDeleted = (id: string) => setLessons(prev => prev.filter(l => l.id !== id));

  if (isLoading) return <div className="text-center p-4"><Spinner /></div>;
  if (error) return <Alert variant="destructive" title="Error">{error}</Alert>;

  const nextOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 0;

  return (
    <div className="space-y-4 pt-4 mt-4 border-t">
      <div className="space-y-3">
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
          <p className="text-sm text-gray-500 text-center py-4">Este módulo no tiene lecciones.</p>
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