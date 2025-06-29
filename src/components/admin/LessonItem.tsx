import React, { useState } from 'react';
import type { Lesson, Evaluation } from '@plataforma-educativa/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { lessonService, UpdateLessonData } from '../../services/lessonService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { FileText, Tv, Puzzle, FileType2, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { EvaluationBuilderModal } from './EvaluationBuilderModal';

interface LessonItemProps {
  lesson: Lesson;
  onLessonUpdated: (updatedLesson: Lesson) => void;
  onLessonDeleted: (lessonId: string) => void;
}

type FormData = Partial<Lesson>;

const ICONS = {
  video: <Tv className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />,
  text: <FileText className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />,
  interactive: <Puzzle className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />,
  quiz: <FileType2 className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />,
};

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onLessonUpdated, onLessonDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  
  const { control, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm<FormData>({ defaultValues: lesson });
  
  const lessonType = watch('lesson_type');
  const evaluationData = watch('evaluation');

  const onCancelEdit = () => { reset(lesson); setIsEditing(false); };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    const dataToUpdate: UpdateLessonData = {
      title: formData.title,
      estimated_duration: Number(formData.estimated_duration),
      content_url: formData.content_url,
      content: formData.content,
      lesson_type: formData.lesson_type,
      evaluation: formData.evaluation,
    };
    
    const promise = lessonService.updateLesson(lesson.id, dataToUpdate);
    toast.promise(promise, {
      loading: 'Actualizando lección...',
      success: (res) => { if (res.error) throw new Error(res.error.message); onLessonUpdated(res.data!); setIsEditing(false); return 'Lección actualizada.'; },
      error: (err) => err.message,
    });
  };

  const performDelete = () => {
    const promise = lessonService.deleteLesson(lesson.id);
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: () => { onLessonDeleted(lesson.id); return 'Eliminada con éxito'; },
      error: 'No se pudo eliminar'
    });
  };
  
  const confirmDelete = () => {
    toast((t) => (
      <div><p>¿Seguro?</p><div className="flex gap-2 mt-2"><Button variant="destructive" size="sm" onClick={() => {toast.dismiss(t.id); performDelete();}}>Sí</Button><Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>No</Button></div></div>
    ));
  };
  
  const handleSaveEvaluation = (data: Partial<Evaluation>) => {
    setValue('evaluation', data);
  };

  if (isEditing) {
    return (
      <>
        <div className="p-3 my-2 border-2 border-indigo-200 rounded-lg bg-white shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Controller name="title" control={control} rules={{ required: true }} render={({ field }) => <Input {...field} placeholder="Título de la lección" />} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title?.message}</p>}
            
            {lessonType === 'quiz' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido de la Evaluación</label>
                <Button type="button" variant="secondary" onClick={() => setIsEvaluationModalOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Evaluación
                </Button>
              </div>
            ) : (
              <div>
                <label>URL / Contenido</label>
                <Controller name="content_url" control={control} render={({ field }) => <Input {...field} placeholder="URL del contenido (opcional)" />} />
              </div>
            )}
            
            <div className="flex justify-end items-center space-x-2">
              <Button type="button" variant="ghost" size="icon" onClick={onCancelEdit} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
              <Button type="submit" variant="ghost" size="icon" isLoading={isSubmitting}><Check className="h-4 w-4 text-green-600" /></Button>
            </div>
          </form>
        </div>
        <EvaluationBuilderModal isOpen={isEvaluationModalOpen} onClose={() => setIsEvaluationModalOpen(false)} onSave={handleSaveEvaluation} existingEvaluation={evaluationData} />
      </>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-gray-100/80 hover:bg-gray-200/70 transition-colors">
      <div className="flex items-center min-w-0">
        {ICONS[lesson.lesson_type] || <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />}
        <span className="font-medium text-gray-800 truncate" title={lesson.title}>{lesson.title}</span>
      </div>
      <div className="flex items-center flex-shrink-0 space-x-1 ml-2">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit2 className="h-4 w-4 text-gray-600" /></Button>
        <Button variant="ghost" size="icon" onClick={confirmDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    </div>
  );
};