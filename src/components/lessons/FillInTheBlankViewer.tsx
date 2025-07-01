import React, { useState, useImperativeHandle, forwardRef } from 'react';
import type { FillInTheBlankContent } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert, AlertTitle, AlertDescription } from '../ui/Alert';

interface FillInTheBlankViewerProps {
  content: FillInTheBlankContent | null | undefined;
  onCompletion: () => void;
}

interface FillInTheBlankViewerRef {
  checkAnswers: () => void;
}

export const FillInTheBlankViewer = forwardRef<FillInTheBlankViewerRef, FillInTheBlankViewerProps>(
  ({ content, onCompletion }, ref) => {
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const allCorrect = isSubmitted && Object.values(results).length > 0 && Object.values(results).every(r => r === true);

    const handleAnswerChange = (blankId: string, answer: string) => {
      setUserAnswers(prev => ({ ...prev, [blankId]: answer }));
      if (isSubmitted) {
        setIsSubmitted(false);
      }
    };

    const checkAnswers = () => {
      if (!content || !content.answers || allCorrect) return;
      const newResults: Record<string, boolean> = {};
      for (const blankId in content.answers) {
        newResults[blankId] = (userAnswers[blankId] || '').trim().toLowerCase() === content.answers[blankId].trim().toLowerCase();
      }
      setResults(newResults);
      setIsSubmitted(true);
      if (Object.values(newResults).every(r => r === true)) {
        onCompletion();
      }
    };

    useImperativeHandle(ref, () => ({
      checkAnswers,
    }));
    
    if (!content || !Array.isArray(content.parts) || !content.answers) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error de Contenido</AlertTitle>
          <AlertDescription>
            El contenido de esta lección no se puede mostrar. Por favor, contacta con un administrador.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-white text-lg leading-loose">
          {content.parts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.value}</span>;
            }
            if (part.type === 'blank' && part.id) {
              const blankId = part.id;
              const answerLength = content.answers[blankId]?.length || 10;
              const inputWidth = Math.max(80, answerLength * 10);
              return (
                <Input
                  key={index}
                  type="text"
                  value={userAnswers[blankId] || ''}
                  onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                  disabled={allCorrect}
                  style={{ width: `${inputWidth}px`, display: 'inline-block', margin: '0 4px' }}
                  className={`mx-2 text-center align-baseline ${isSubmitted ? (results[blankId] ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300'}`}
                />
              );
            }
            return null;
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={checkAnswers} disabled={allCorrect}>
            {allCorrect ? 'Completado' : 'Comprobar Respuestas'}
          </Button>
        </div>

        {isSubmitted && (
          allCorrect ? (
            <Alert variant="default" className="bg-green-100 border-green-300">
              <AlertTitle className="font-bold text-green-800">¡Excelente!</AlertTitle>
              <AlertDescription className="text-green-700">
                Todas tus respuestas son correctas. ¡Buen trabajo! Puedes continuar.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle className="font-bold">Algunas respuestas no son correctas</AlertTitle>
              <AlertDescription>
                Revisa las casillas marcadas en rojo e inténtalo de nuevo.
              </AlertDescription>
            </Alert>
          )
        )}
      </div>
    );
  }
);