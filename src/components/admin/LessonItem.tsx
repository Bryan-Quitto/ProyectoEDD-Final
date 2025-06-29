import React, { useState } from 'react';
import type { Lesson } from '@plataforma-educativa/types';
import { lessonService } from '../../services/lessonService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface LessonItemProps {
  lesson: Lesson;
  onLessonUpdated: (updatedLesson: Lesson) => void;
  onLessonDeleted: (lessonId: string) => void;
}

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onLessonUpdated, onLessonDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lesson.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!editedTitle.trim()) return;
    setError(null);
    setIsSubmitting(true);
    const response = await lessonService.updateLesson(lesson.id, { title: editedTitle });
    if (response.data) {
      onLessonUpdated(response.data);
      setIsEditing(false);
    } else {
      setError(response.error?.message || 'Error al actualizar.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Seguro que quieres eliminar la lección "${lesson.title}"?`)) {
      setIsSubmitting(true);
      const response = await lessonService.deleteLesson(lesson.id);
      if (response.data) {
        onLessonDeleted(lesson.id);
      } else {
        setError(response.error?.message || 'Error al eliminar.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white p-3 rounded-md border flex items-center justify-between">
      {isEditing ? (
        <div className="flex-grow flex items-center space-x-2">
          <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
          <Button onClick={handleUpdate} size="sm" disabled={isSubmitting}>
            <Spinner size="sm" className={isSubmitting ? 'block' : 'hidden'} />
            <span className={isSubmitting ? 'hidden' : 'block'}>OK</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
            X
          </Button>
        </div>
      ) : (
        <>
          <span className="text-gray-700">{lesson.title}</span>
          <div className="space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                {isSubmitting ? <Spinner size="sm" /> : 'Eliminar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};