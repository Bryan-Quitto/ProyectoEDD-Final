import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useFieldArray, useForm, Controller, useWatch } from 'react-hook-form';
import type { Evaluation, Question } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Plus, Trash2 } from 'lucide-react';

type QuestionFormData = Partial<Question> & { id: string };
type FormDataType = Partial<Evaluation> & {
  questions?: QuestionFormData[];
};

interface EvaluationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evaluationData: Partial<Evaluation>) => void;
  existingEvaluation?: Partial<Evaluation> | null;
  evaluationType: 'diagnostic' | 'project' | 'quiz';
  moduleTitle: string;
}

export const EvaluationBuilderModal: React.FC<EvaluationBuilderModalProps> = ({ isOpen, onClose, onSave, existingEvaluation, evaluationType, moduleTitle }) => {
  const { control, handleSubmit, register, getValues, setValue, reset } = useForm<FormDataType>();

  useEffect(() => {
    if (isOpen) {
      const isDiagnostic = evaluationType === 'diagnostic';
      const isQuiz = evaluationType === 'quiz';
      
      let title = `Evaluación Final: ${moduleTitle}`;
      if (isDiagnostic) title = `Prueba de Diagnóstico: ${moduleTitle}`;
      if (isQuiz) title = `Autoevaluación para la lección`;

      const defaultValues = {
        title: title,
        evaluation_type: evaluationType,
        passing_score: isDiagnostic ? 50 : 70,
        max_attempts: isDiagnostic ? 1 : (isQuiz ? 100 : 3),
        questions: [{ id: crypto.randomUUID(), question_text: '', question_type: 'multiple_choice' as const, points: 10, options: ['', ''], correct_options: [] }]
      };
      
      const initialData = existingEvaluation && existingEvaluation.questions && existingEvaluation.questions.length > 0 
        ? { ...defaultValues, ...existingEvaluation }
        : { ...existingEvaluation, ...defaultValues };

      reset(initialData);
    }
  }, [isOpen, existingEvaluation, reset, evaluationType, moduleTitle]);

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' as 'questions' });
  const questions = useWatch({ control, name: 'questions', defaultValue: [] });
  const maxScore = (questions || []).reduce((sum, q) => sum + (Number(q?.points) || 0), 0);

  const onSubmit = (data: FormDataType) => {
    const finalEvaluationData = { 
      ...existingEvaluation,
      ...data,
      module_id: existingEvaluation?.module_id,
      evaluation_type: evaluationType,
      time_limit_minutes: Number(data.time_limit_minutes) || undefined, 
      max_score: maxScore, 
    };
    onSave(finalEvaluationData);
    onClose();
  };
  
  const addNewQuestion = () => {
    append({ id: crypto.randomUUID(), question_text: '', question_type: 'multiple_choice' as const, points: 10, options: ['', ''], correct_options: [] });
  };
  
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const currentOptions = getValues(`questions.${qIndex}.options`) || [];
    const newOptions = [...currentOptions];
    newOptions[oIndex] = value;
    setValue(`questions.${qIndex}.options`, newOptions);
  };
  
  const addOption = (qIndex: number) => {
    const currentOptions = getValues(`questions.${qIndex}.options`) || [];
    setValue(`questions.${qIndex}.options`, [...currentOptions, '']);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const currentOptions = getValues(`questions.${qIndex}.options`) || [];
    const newOptions = currentOptions.filter((_, i) => i !== oIndex);
    setValue(`questions.${qIndex}.options`, newOptions);
    
    const correctOptions = getValues(`questions.${qIndex}.correct_options`) || [];
    const newCorrectOptions = correctOptions.filter(i => i !== oIndex).map(i => i > oIndex ? i - 1 : i);
    setValue(`questions.${qIndex}.correct_options`, newCorrectOptions);
  };

  const getDialogTitle = () => {
    const action = existingEvaluation && existingEvaluation.id ? 'Editar' : 'Crear';
    switch(evaluationType) {
        case 'diagnostic': return `${action} Prueba de Diagnóstico`;
        case 'project': return `${action} Evaluación Final`;
        case 'quiz': return `${action} Autoevaluación (Quiz)`;
        default: return `${action} Evaluación`;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-25" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"><span>{getDialogTitle()}</span><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="h-4 w-4" /></button></Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label>Título</label><Input {...register('title', { required: true })} /></div>
                    <div><label>Puntaje para Aprobar (%)</label><Input type="number" {...register('passing_score', { required: true, min: 1, max: 100, valueAsNumber: true })} /></div>
                    <div><label>Límite de Tiempo (min)</label><Input type="number" {...register('time_limit_minutes', { min: 1, valueAsNumber: true })} placeholder="Sin límite"/></div>
                    <div><label>Máx. Intentos</label><Input type="number" {...register('max_attempts', { required: true, min: 1, valueAsNumber: true })} disabled={evaluationType === 'diagnostic'} /></div>
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
                              <label>Opciones y Respuesta Correcta</label>
                              {value.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <Controller control={control} name={`questions.${index}.correct_options`} defaultValue={[]} render={({ field: checkboxField }) => (<input type="checkbox" checked={checkboxField.value?.includes(optIndex)} onChange={(e) => { const newValues = e.target.checked ? [...(checkboxField.value || []), optIndex] : (checkboxField.value || []).filter(v => v !== optIndex); checkboxField.onChange(newValues); }} className="form-checkbox h-5 w-5 text-indigo-600 rounded"/>)} />
                                  <Input value={option || ''} onChange={(e) => handleOptionChange(index, optIndex, e.target.value)} placeholder={`Opción ${optIndex + 1}`} />
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
                  <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar Evaluación</Button></div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};