import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Evaluation, EvaluationAttempt } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { evaluationService } from '../../services/evaluationService';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';

interface QuizRunnerProps {
  evaluation: Evaluation;
  onQuizComplete: (attempt: EvaluationAttempt) => void;
}

type FormData = {
  answers: Record<string, number[]>;
};

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ evaluation, onQuizComplete }) => {
  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      answers: evaluation.questions.reduce((acc, q) => ({ ...acc, [q.id]: [] }), {}),
    },
  });
  
  const [timeLeft, setTimeLeft] = useState((evaluation.time_limit_minutes || 0) * 60);

  const submitQuiz = useCallback(async () => {
    const data = getValues();
    const cleanedAnswers = Object.entries(data.answers)
      .filter(([, value]) => Array.isArray(value))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value.sort() }), {});

    const promise = evaluationService.submitAttempt(evaluation.id, cleanedAnswers);

    toast.promise(promise, {
      loading: 'Calificando tu examen...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        onQuizComplete(res.data!);
        return '¡Examen calificado!';
      },
      error: (err) => err.message,
    });
  }, [evaluation.id, getValues, onQuizComplete]);

  useEffect(() => {
    if (!evaluation.time_limit_minutes) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          toast('¡Se acabó el tiempo! Enviando examen...', { icon: '⌛' });
          submitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [evaluation.time_limit_minutes, submitQuiz]);

  const onSubmit = () => {
    const data = getValues();
    const answeredQuestions = Object.values(data.answers).filter(val => val.length > 0).length;
    
    if (answeredQuestions !== evaluation.questions.length) {
      toast((t) => ( <div className="flex flex-col items-center gap-2"> <span>¿Seguro? No has respondido todas las preguntas.</span> <div className="flex gap-2"> <Button variant="destructive" size="sm" onClick={() => {toast.dismiss(t.id); submitQuiz();}}>Sí, enviar</Button> <Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>Cancelar</Button> </div> </div> ), { duration: 6000 });
    } else {
        submitQuiz();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {evaluation.time_limit_minutes && (
        <div className="sticky top-16 bg-white py-2 z-10 -mt-8 -mx-8 px-8 border-b">
           <div className="font-mono text-lg font-bold flex items-center justify-center text-gray-700 bg-gray-100 p-2 rounded-md">
                <Clock className="h-5 w-5 mr-2" />
                <span>Tiempo Restante: {formatTime(timeLeft)}</span>
            </div>
        </div>
      )}
      
      {evaluation.questions.map((question, qIndex) => (
        <div key={question.id} className="p-6 border rounded-lg bg-gray-50/50">
          <p className="font-semibold text-lg mb-4">{qIndex + 1}. {question.question_text}</p>
          <Controller
            name={`answers.${question.id}`}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className="space-y-3">
                {question.options?.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400">
                    <input
                      type="checkbox"
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const newValues = e.target.checked
                            ? [...field.value, oIndex]
                            : field.value.filter(v => v !== oIndex);
                        field.onChange(newValues);
                      }}
                      checked={field.value.includes(oIndex)}
                      className="h-5 w-5 mr-4 form-checkbox text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      ))}
      <div className="flex justify-center mt-8">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Enviar Examen
        </Button>
      </div>
    </form>
  );
};