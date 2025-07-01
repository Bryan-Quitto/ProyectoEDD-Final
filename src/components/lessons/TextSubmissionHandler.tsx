import React, { useState, useEffect, useCallback } from 'react';
import type { Lesson, TextContent, TextLessonSubmission } from '@plataforma-educativa/types';
import { useAuth } from '../../hooks/useAuth';
import { submissionService } from '../../services/submissionService';
import { Spinner } from '../ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Editor } from '@tinymce/tinymce-react';
import toast from 'react-hot-toast';

interface TextSubmissionHandlerProps {
  lesson: Lesson;
  onSubmissionComplete: () => void;
}

export const TextSubmissionHandler: React.FC<TextSubmissionHandlerProps> = ({ lesson, onSubmissionComplete }) => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<TextLessonSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user || !lesson.id) return;
      try {
        const { data, error: apiError } = await submissionService.getSubmission(lesson.id, user.id);
        if (apiError) throw new Error(apiError.message);
        if (data) {
          setSubmission({
            ...data,
            score: data.score ?? null,
            feedback: data.feedback ?? null,
            graded_at: data.graded_at ?? null,
          });
        }
      } catch (err: any) {
        setError('No se pudo cargar la entrega anterior.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmission();
  }, [lesson.id, user]);

  const handleSubmit = useCallback(async () => {
    if (!user || !lesson.id) return;
    if (!responseText.trim()) {
      toast.error('La respuesta no puede estar vacía.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error: apiError } = await submissionService.submitTextLesson(lesson.id, user.id, responseText);
      if (apiError) throw new Error(apiError.message);
      if (data) {
        setSubmission({
            ...data,
            score: data.score ?? null,
            feedback: data.feedback ?? null,
            graded_at: data.graded_at ?? null,
        });
        toast.success('¡Lección enviada con éxito!');
        onSubmissionComplete();
      }
    } catch (err: any) {
      toast.error(`Error al enviar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [lesson.id, user, responseText, onSubmissionComplete]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert variant="destructive">{error}</Alert>;
  
  const enunciado = (lesson.content as TextContent)?.text || 'El enunciado de esta lección no está disponible.';

  if (submission) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Enunciado de la Lección</h3>
          <div className="prose max-w-none p-4 border rounded-md bg-gray-100" dangerouslySetInnerHTML={{ __html: enunciado }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Tu Entrega</h3>
          <div className="p-4 border rounded-md bg-gray-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: submission.content }} />
        </div>
        {submission.status === 'graded' ? (
          <Alert variant="default" className="bg-green-100 border-green-200">
            <AlertTitle className="font-bold text-green-800">Calificada</AlertTitle>
            <p className="text-sm text-green-700"><strong>Nota:</strong> {submission.score ?? 'N/A'}/100</p>
            <div className="mt-2 pt-2 border-t border-green-300">
              <p className="font-semibold text-green-800">Retroalimentación del profesor:</p>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: submission.feedback || 'Sin retroalimentación.' }} />
            </div>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle className="font-bold">Entregado</AlertTitle>
            <AlertDescription>Tu lección ha sido enviada y está pendiente de calificación.</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enunciado</h3>
        <div className="prose max-w-none p-4 border rounded-md bg-gray-50" dangerouslySetInnerHTML={{ __html: enunciado }} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tu Respuesta</label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          value={responseText}
          onEditorChange={(content: string) => setResponseText(content)}
          init={{
            height: 300,
            menubar: false,
            plugins: ['wordcount', 'lists', 'autolink'],
            toolbar: 'undo redo | blocks | bold italic | bullist numlist',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            skin: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide'),
            content_css: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'),
            promotion: false,
            branding: false,
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          Enviar a revisión
        </Button>
      </div>
    </div>
  );
};