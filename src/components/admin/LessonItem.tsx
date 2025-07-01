import React, { useState } from 'react';
import type { Lesson, Evaluation, ApiResponse, TextContent } from '@plataforma-educativa/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { lessonService } from '../../services/lessonService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FileText, Edit2, Trash2, Check, X, ShieldQuestion, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';
import { EvaluationBuilderModal } from './EvaluationBuilderModal';
import { FillInTheBlankEditor } from './FillInTheBlankEditor';

interface LessonItemProps {
  lesson: Lesson;
  onLessonUpdated: (updatedLesson: Lesson) => void;
  onLessonDeleted: (lessonId: string) => void;
}

type FormData = Partial<Lesson>;

const ICONS: Record<Lesson['lesson_type'], React.ReactNode> = {
  text: <FileText className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />,
  quiz: <ShieldQuestion className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />,
  fill_in_the_blank: <BrainCircuit className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />,
};

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onLessonUpdated, onLessonDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  
  const { control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({ defaultValues: lesson });
  
  const lessonType = watch('lesson_type');
  const evaluationData = watch('evaluation');

  const onCancelEdit = () => { reset(lesson); setIsEditing(false); };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    const dataToUpdate = {
      title: formData.title,
      target_level: formData.target_level,
      estimated_duration: Number(formData.estimated_duration),
      content: formData.content,
      evaluation: formData.evaluation,
      lesson_type: formData.lesson_type,
    };
    
    const promise = lessonService.updateLesson(lesson.id, dataToUpdate);
    toast.promise(promise, {
      loading: 'Actualizando lección...',
      success: (res: ApiResponse<Lesson>) => { if (res.error) throw new Error(res.error.message); onLessonUpdated(res.data!); setIsEditing(false); return 'Lección actualizada.'; },
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
            <Controller name="target_level" control={control} render={({ field }) => ( <select {...field} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="core">Principal (Core)</option> <option value="remedial">Refuerzo (Remedial)</option> <option value="advanced">Avanzado (Advanced)</option> </select> )} />
            
            {lessonType === 'quiz' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido de la Autoevaluación</label>
                <Button type="button" variant="secondary" onClick={() => setIsEvaluationModalOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar Autoevaluación
                </Button>
              </div>
            ) : lessonType === 'text' ? (
              <Controller name="content" control={control} render={({ field }) => <textarea {...field} value={(field.value as TextContent)?.text || ''} onChange={(e) => field.onChange({ text: e.target.value })} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />} />
            ) : (
              <Controller name="content" control={control} render={({ field }) => <FillInTheBlankEditor value={field.value} onChange={field.onChange} />} />
            )}
            
            <div className="flex justify-end items-center space-x-2">
              <Button type="button" variant="ghost" size="icon" onClick={onCancelEdit} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
              <Button type="submit" variant="ghost" size="icon" isLoading={isSubmitting}><Check className="h-4 w-4 text-green-600" /></Button>
            </div>
          </form>
        </div>
        {isEvaluationModalOpen && lesson && (
          <EvaluationBuilderModal isOpen={isEvaluationModalOpen} onClose={() => setIsEvaluationModalOpen(false)} onSave={handleSaveEvaluation} existingEvaluation={evaluationData} evaluationType="quiz" moduleTitle={lesson.title} />
        )}
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