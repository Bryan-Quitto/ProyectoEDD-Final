import React, { useState } from 'react';
import type { FillInTheBlankContent } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert, AlertTitle, AlertDescription } from '../ui/Alert';

interface FillInTheBlankViewerProps {
  content: FillInTheBlankContent;
}

export const FillInTheBlankViewer: React.FC<FillInTheBlankViewerProps> = ({ content }) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerChange = (blankId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [blankId]: answer }));
    setIsSubmitted(false); // Reset submission state if user changes an answer
  };

  const checkAnswers = () => {
    const newResults: Record<string, boolean> = {};
    for (const blankId in content.answers) {
      newResults[blankId] = (userAnswers[blankId] || '').trim().toLowerCase() === content.answers[blankId].trim().toLowerCase();
    }
    setResults(newResults);
    setIsSubmitted(true);
  };

  const allCorrect = isSubmitted && Object.values(results).every(r => r === true);

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-white text-lg leading-loose">
        {content.parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.value}</span>;
          }
          if (part.type === 'blank' && part.id) {
            const blankId = part.id;
            const inputWidth = (content.answers[blankId]?.length || 10) * 12;
            return (
              <Input
                key={index}
                type="text"
                value={userAnswers[blankId] || ''}
                onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                style={{ width: `${inputWidth}px`, display: 'inline-block', margin: '0 4px' }}
                className={`mx-2 text-center align-baseline ${isSubmitted ? (results[blankId] ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300'}`}
              />
            );
          }
          return null;
        })}
      </div>

      <div className="flex justify-center">
        <Button onClick={checkAnswers}>Comprobar Respuestas</Button>
      </div>

      {isSubmitted && (
        allCorrect ? (
          <Alert variant="default" className="bg-green-100 border-green-300">
            <AlertTitle className="font-bold text-green-800">¡Excelente!</AlertTitle>
            <AlertDescription className="text-green-700">
              Todas tus respuestas son correctas. ¡Buen trabajo!
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
};