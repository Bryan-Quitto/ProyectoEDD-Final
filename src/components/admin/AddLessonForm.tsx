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
import { FillInTheBlankEditor } from './FillInTheBlankEditor';
import { Editor } from '@tinymce/tinymce-react';

interface AddLessonFormProps {
  moduleId: string;
  onLessonAdded: (newLesson: Lesson) => void;
  nextOrderIndex: number;
}

type FormDataType = {
  title: string;
  lesson_type: 'text' | 'fill_in_the_blank' | 'quiz';
  target_level: 'core' | 'remedial' | 'advanced';
  estimated_duration: number;
  content: any;
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
    defaultValues: {
      title: '',
      lesson_type: 'text',
      target_level: 'core',
      estimated_duration: 5,
      content: { text: '' }
    }
  });

  const lessonType = watch('lesson_type');
  const evaluationData = watch('evaluation');

  const onSubmit: SubmitHandler<FormDataType> = async (formData) => {
    setFormError(null);
    
    const lessonPayload: CreateLessonData = {
      title: formData.title,
      module_id: moduleId,
      estimated_duration: Number(formData.estimated_duration),
      order_index: nextOrderIndex,
      is_active: true,
      lesson_type: formData.lesson_type,
      target_level: formData.target_level,
      content: formData.content || null,
      evaluation: formData.lesson_type === 'quiz' ? formData.evaluation as Evaluation : undefined
    };

    const response = await lessonService.createLesson(lessonPayload);

    if (response.data) {
      onLessonAdded(response.data);
      reset({ title: '', lesson_type: 'text', target_level: 'core', estimated_duration: 5, content: { text: '' } });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Tipo de Lección</label>
              <Controller name="lesson_type" control={control} render={({ field }) => ( <select {...field} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="text">Texto Abierto</option> <option value="fill_in_the_blank">Completar Espacios</option> <option value="quiz">Prueba</option> </select> )} />
            </div>
            <div>
              <label>Nivel de Destino</label>
              <Controller name="target_level" control={control} render={({ field }) => ( <select {...field} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="core">Principal</option> <option value="remedial">Remedial</option> <option value="advanced">Avanzado</option> </select> )} />
            </div>
            <div>
              <label>Duración (min)</label>
              <Controller name="estimated_duration" control={control} rules={{ required: true, min: 1 }} render={({ field }) => <Input type="number" {...field} />} />
            </div>
          </div>
          {lessonType === 'quiz' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido de la prueba</label>
              <Button type="button" variant="secondary" onClick={() => setIsEvaluationModalOpen(true)}>
                {evaluationData ? <Check className="h-4 w-4 mr-2 text-green-500"/> : <Edit2 className="h-4 w-4 mr-2" />}
                {evaluationData ? 'Editar prueba' : 'Diseñar prueba'}
              </Button>
            </div>
          )}
          {lessonType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado del texto</label>
              <Controller
                name="content"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                    value={value?.text || ''}
                    onEditorChange={(newText: string) => onChange({ text: newText })}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                  />
                )}
              />
            </div>
          )}
          {lessonType === 'fill_in_the_blank' && (
            <Controller name="content" control={control} render={({ field }) => <FillInTheBlankEditor value={field.value} onChange={field.onChange} />} />
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
      {isEvaluationModalOpen && <EvaluationBuilderModal isOpen={isEvaluationModalOpen} onClose={() => setIsEvaluationModalOpen(false)} onSave={handleSaveEvaluation} evaluationType="quiz" moduleTitle="Autoevaluación de Lección" />}
    </>
  );
};