import React, { useEffect } from 'react';
import { useFieldArray, useForm, Controller, useWatch } from 'react-hook-form';
import type { Evaluation, Question } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2 } from 'lucide-react';

type QuestionFormData = Partial<Question> & { id: string };
export type EvaluationFormData = Partial<Evaluation> & {
    questions?: QuestionFormData[];
};

interface EvaluationFormProps {
  onSave: (evaluationData: EvaluationFormData) => Promise<void>;
  existingEvaluation?: Partial<Evaluation> | null;
  onCancel: () => void;
  isSaving: boolean;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ onSave, existingEvaluation, onCancel, isSaving }) => {
  const { control, handleSubmit, register, getValues, setValue, reset } = useForm<EvaluationFormData>({
    defaultValues: {
      title: '',
      description: '',
      evaluation_type: 'quiz',
      passing_score: 70,
      max_attempts: 1,
      questions: [],
    }
  });

  useEffect(() => {
    const defaultData = {
      title: 'Evaluación Final del Módulo',
      description: 'Evalúa los conocimientos adquiridos en este módulo.',
      evaluation_type: 'quiz' as const,
      passing_score: 70,
      max_attempts: 1,
      questions: [{ id: crypto.randomUUID(), question_text: '', question_type: 'multiple_choice' as const, points: 10, options: ['', ''], correct_options: [] }],
    };
    reset(existingEvaluation && existingEvaluation.id ? existingEvaluation : defaultData);
  }, [existingEvaluation, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' as 'questions' });
  const questions = useWatch({ control, name: 'questions', defaultValue: [] });
  const maxScore = (questions || []).reduce((sum, q) => sum + (Number(q?.points) || 0), 0);

  const onSubmit = (data: EvaluationFormData) => {
    const finalEvaluationData = { 
      ...data, 
      time_limit_minutes: Number(data.time_limit_minutes) || undefined, 
      max_score: maxScore, 
      evaluation_type: 'quiz' as const, 
    };
    onSave(finalEvaluationData);
  };
  
  const addNewQuestion = () => append({ id: crypto.randomUUID(), question_text: '', question_type: 'multiple_choice' as const, points: 10, options: ['', ''], correct_options: [] });
  
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newOptions = [...(getValues(`questions.${qIndex}.options`) || [])];
    newOptions[oIndex] = value;
    setValue(`questions.${qIndex}.options`, newOptions);
  };
  
  const addOption = (qIndex: number) => setValue(`questions.${qIndex}.options`, [...(getValues(`questions.${qIndex}.options`) || []), '']);

  const removeOption = (qIndex: number, oIndex: number) => {
    const currentOptions = getValues(`questions.${qIndex}.options`) || [];
    setValue(`questions.${qIndex}.options`, currentOptions.filter((_, i) => i !== oIndex));
    const correctOptions = getValues(`questions.${qIndex}.correct_options`) || [];
    setValue(`questions.${qIndex}.correct_options`, correctOptions.filter(i => i !== oIndex).map(i => i > oIndex ? i - 1 : i));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div><label>Título</label><Input {...register('title', { required: true })} /></div>
        <div><label>Puntaje para Aprobar (%)</label><Input type="number" {...register('passing_score', { required: true, min: 1, max: 100, valueAsNumber: true })} /></div>
        <div><label>Límite de Tiempo (min)</label><Input type="number" {...register('time_limit_minutes', { min: 1, valueAsNumber: true })} placeholder="Sin límite"/></div>
        <div><label>Máx. Intentos</label><Input type="number" {...register('max_attempts', { required: true, min: 1, valueAsNumber: true })} /></div>
      </div>
      <div className="space-y-4 pt-4 border-t">
        <div className="flex justify-between items-center"><h4 className="font-semibold">Preguntas</h4><span className="text-sm font-bold text-gray-600">Puntaje Máximo: {maxScore}</span></div>
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
            <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></button>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-4"><label>Pregunta {index + 1}</label><Input {...register(`questions.${index}.question_text`, { required: true })} /></div>
              <div><label>Puntos</label><Input type="number" {...register(`questions.${index}.points`, { required: true, valueAsNumber: true, min: 1 })} /></div>
            </div>
            <Controller control={control} name={`questions.${index}.options`} render={({ field: { value = [] } }) => (
                <div className="space-y-2 col-span-2">
                  <label>Opciones y Respuestas Correctas</label>
                  {value.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Input value={option || ''} onChange={(e) => handleOptionChange(index, optIndex, e.target.value)} placeholder={`Opción ${optIndex + 1}`} />
                      <Controller control={control} name={`questions.${index}.correct_options`} defaultValue={[]} render={({ field: checkboxField }) => (<input type="checkbox" checked={checkboxField.value?.includes(optIndex)} onChange={(e) => { const newValues = e.target.checked ? [...(checkboxField.value || []), optIndex] : (checkboxField.value || []).filter(v => v !== optIndex); checkboxField.onChange(newValues); }} className="form-checkbox h-5 w-5 text-indigo-600 rounded"/>)} />
                      <button type="button" onClick={() => removeOption(index, optIndex)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500"/></button>
                    </div>
                  ))}
                   <Button type="button" size="sm" variant="outline" onClick={() => addOption(index)}><Plus className="h-4 w-4 mr-1"/>Añadir Opción</Button>
                </div>
            )} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addNewQuestion}><Plus className="mr-2 h-4 w-4" /> Añadir Pregunta</Button>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" isLoading={isSaving}>Guardar Evaluación</Button>
      </div>
    </form>
  );
};