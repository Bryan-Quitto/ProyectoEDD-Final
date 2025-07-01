import React, { Fragment } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import type { Lesson, TextLessonSubmission } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { supabase } from '../../services/supabase';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSubmission: TextLessonSubmission) => void;
  lesson: Lesson;
  submission: TextLessonSubmission;
}

type FormData = {
  score: number;
  feedback: string;
};

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({ isOpen, onClose, onSave, lesson, submission }) => {
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    defaultValues: {
      score: submission.score || 0,
      feedback: submission.feedback || '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      const { data, error } = await supabase
        .from('text_lesson_submissions')
        .update({
          score: formData.score,
          feedback: formData.feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
        })
        .eq('id', submission.id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Calificación guardada con éxito.');
      onSave(data);

    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar la calificación.');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-95" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>Calificar Tarea: {lesson.title}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="h-4 w-4" /></button>
                </Dialog.Title>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-800">Enunciado</h4>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: (lesson.content as any)?.text || ''}} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">Respuesta del Estudiante</h4>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: submission.content }} />
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="score" className="block text-sm font-medium text-gray-700">Nota (sobre 100)</label>
                            <Controller name="score" control={control} rules={{ required: 'La nota es obligatoria', min: 0, max: 100 }} render={({ field }) => <Input id="score" type="number" {...field} />} />
                            {errors.score && <p className="text-xs text-red-500 mt-1">{errors.score.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">Retroalimentación</label>
                            <Controller name="feedback" control={control} render={({ field }) => (
                                <Editor
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                    value={field.value}
                                    onEditorChange={(content: string) => field.onChange(content)}
                                    init={{
                                        height: 250,
                                        menubar: false,
                                        plugins: ['wordcount', 'lists', 'autolink', 'link'],
                                        toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link',
                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                        skin: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide'),
                                        content_css: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'),
                                        promotion: false,
                                        branding: false,
                                    }}
                                />
                            )} />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" isLoading={isSubmitting}>Guardar Calificación</Button>
                        </div>
                    </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};