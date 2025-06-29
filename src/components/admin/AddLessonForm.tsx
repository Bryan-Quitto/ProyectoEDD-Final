import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import type { Lesson, Evaluation } from '@plataforma-educativa/types';
import { lessonService, CreateLessonData } from '../../services/lessonService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { EvaluationBuilderModal } from './EvaluationBuilderModal';
import { Check, Edit2 } from 'lucide-react';

interface AddLessonFormProps {
  moduleId: string;
  onLessonAdded: (newLesson: Lesson) => void;
  nextOrderIndex: number;
}

type FormDataType = {
  title: string;
  lesson_type: 'video' | 'text' | 'interactive' | 'quiz';
  estimated_duration: number;
  content_url: string;
  content: string;
  evaluation?: Partial<Evaluation>;
};

export const AddLessonForm: React.FC<AddLessonFormProps> = ({ moduleId, onLessonAdded, nextOrderIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormDataType>({
    defaultValues: { title: '', lesson_type: 'text', estimated_duration: 5, content_url: '', content: '' }
  });

  const lessonType = watch('lesson_type');
  const evaluationData = watch('evaluation');

  const onSubmit: SubmitHandler<FormDataType> = async (formData) => {
    setFormError(null);
    
    const lessonPayload: CreateLessonData = {
      title: formData.title || 'Sin Título',
      module_id: moduleId,
      estimated_duration: Number(formData.estimated_duration) || 0,
      order_index: nextOrderIndex,
      is_active: true,
      lesson_type: formData.lesson_type || 'text',
      content: formData.content || null,
      content_url: formData.content_url || undefined,
      evaluation: formData.evaluation as Evaluation
    };

    const response = await lessonService.createLesson(lessonPayload);

    if (response.data) {
      onLessonAdded(response.data);
      reset();
      setIsExpanded(false);
    } else {
      setFormError(response.error?.message || 'Ocurrió un error inesperado.');
    }
  };
  
  const handleSaveEvaluation = (data: Partial<Evaluation>) => {
      setValue('evaluation', data);
  };

  if (!isExpanded) {
    return (
      <div className="flex justify-center mt-4"><Button variant="outline" onClick={() => setIsExpanded(true)}>+ Añadir Nueva Lección</Button></div>
    );
  }

  return (
    <>
      <div className="p-4 mt-4 border-t border-dashed bg-gray-50 rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Crear Lección</h3>
          <div>
            <label>Título</label>
            <Controller name="title" control={control} rules={{ required: 'El título es obligatorio' }} render={({ field }) => <Input {...field} />} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Tipo</label>
              <Controller name="lesson_type" control={control} render={({ field }) => ( <select {...field} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="text">Texto</option> <option value="video">Video</option> <option value="quiz">Quiz</option> </select> )} />
            </div>
            <div>
              <label>Duración (min)</label>
              <Controller name="estimated_duration" control={control} rules={{ required: true, min: 1 }} render={({ field }) => <Input type="number" {...field} />} />
              {errors.estimated_duration && <p className="text-red-500 text-xs mt-1">{errors.estimated_duration.message}</p>}
            </div>
          </div>
          {lessonType === 'quiz' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido de la Evaluación</label>
                <Button type="button" variant="secondary" onClick={() => setIsEvaluationModalOpen(true)}>
                  {evaluationData ? <Check className="h-4 w-4 mr-2 text-green-500"/> : <Edit2 className="h-4 w-4 mr-2" />}
                  {evaluationData ? 'Editar Evaluación' : 'Diseñar Evaluación'}
                </Button>
              </div>
          ) : lessonType === 'text' ? (
             <div>
                <label>Contenido</label>
                <Controller name="content" control={control} render={({ field }) => <textarea {...field} rows={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />} />
              </div>
          ) : (
             <div>
                <label>URL del Contenido</label>
                <Controller name="content_url" control={control} render={({ field }) => <Input {...field} placeholder="https://..." />} />
              </div>
          )}
          {formError && <Alert variant="destructive" title="Error">{formError}</Alert>}
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setIsExpanded(false); reset(); }} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || (lessonType === 'quiz' && !evaluationData)}>
              {isSubmitting ? <Spinner size="sm" /> : 'Guardar Lección'}
            </Button>
          </div>
        </form>
      </div>
      <EvaluationBuilderModal isOpen={isEvaluationModalOpen} onClose={() => setIsEvaluationModalOpen(false)} onSave={handleSaveEvaluation} />
    </>
  );
};