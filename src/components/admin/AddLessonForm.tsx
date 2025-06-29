import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Lesson } from '@plataforma-educativa/types';
import { lessonService, CreateLessonData } from '../../services/lessonService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';

interface AddLessonFormProps {
  moduleId: string;
  onLessonAdded: (newLesson: Lesson) => void;
  nextOrderIndex: number;
}

type LessonInputs = {
  title: string;
  estimated_duration: number;
};

export const AddLessonForm: React.FC<AddLessonFormProps> = ({ moduleId, onLessonAdded, nextOrderIndex }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LessonInputs>();
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LessonInputs> = async (formData) => {
    setFormError(null);
    const newLessonData: CreateLessonData = {
      ...formData,
      module_id: moduleId,
      order_index: nextOrderIndex,
      estimated_duration: Number(formData.estimated_duration),
      lesson_type: 'text',
      is_active: true,
    };

    const response = await lessonService.createLesson(newLessonData);

    if (response.data) {
      onLessonAdded(response.data);
      reset();
    } else {
      setFormError(response.error?.message || 'Ocurrió un error desconocido.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-gray-100 rounded-md border">
      <h5 className="text-md font-semibold text-gray-700 mb-2">Añadir Nueva Lección</h5>
      {formError && <Alert variant="destructive" title="Error">{formError}</Alert>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div className="md:col-span-2">
          <Input
            id="new-lesson-title"
            placeholder="Título de la lección"
            {...register('title', { required: 'El título es obligatorio' })}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Input
            id="new-lesson-duration"
            type="number"
            placeholder="Duración (min)"
            {...register('estimated_duration', { 
              required: 'La duración es obligatoria', 
              valueAsNumber: true,
              min: { value: 1, message: 'Debe ser al menos 1' } 
            })}
          />
          {errors.estimated_duration && <p className="text-red-500 text-xs mt-1">{errors.estimated_duration.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="md:col-span-3">
          {isSubmitting ? <Spinner size="sm" /> : 'Añadir Lección'}
        </Button>
      </div>
    </form>
  );
};