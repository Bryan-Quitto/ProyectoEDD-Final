import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FillInTheBlankEditorProps {
  value: any;
  onChange: (value: any) => void;
}

type ContentPart = { type: 'text' | 'blank'; value: string; id?: string };

export const FillInTheBlankEditor: React.FC<FillInTheBlankEditorProps> = ({ value, onChange }) => {
  const [parts, setParts] = useState<ContentPart[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (value && value.parts) {
      setParts(value.parts);
      setAnswers(value.answers || {});
    } else {
      setParts([{ type: 'text', value: '' }]);
    }
  }, [value]);

  const updateParentForm = (newParts: ContentPart[], newAnswers: Record<string, string>) => {
    onChange({ parts: newParts, answers: newAnswers });
  };

  const handlePartChange = (index: number, newValue: string) => {
    const newParts = [...parts];
    newParts[index].value = newValue;
    setParts(newParts);
    updateParentForm(newParts, answers);
  };

  const handleAnswerChange = (id: string, newAnswer: string) => {
    const newAnswers = { ...answers, [id]: newAnswer };
    setAnswers(newAnswers);
    updateParentForm(parts, newAnswers);
  };

  const addPart = (type: 'text' | 'blank', index: number) => {
    const newParts = [...parts];
    const newPart: ContentPart = type === 'text' 
      ? { type: 'text', value: '' }
      : { type: 'blank', value: 'Hueco', id: `blank_${Date.now()}` };
    newParts.splice(index + 1, 0, newPart);
    setParts(newParts);
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <label className="block text-sm font-medium text-gray-700 mb-2">Editor de "Completar Espacios"</label>
      <div className="space-y-2">
        {parts.map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            {part.type === 'text' ? (
              <Input
                value={part.value}
                onChange={(e) => handlePartChange(index, e.target.value)}
                placeholder="Escribe texto aquí..."
                className="flex-grow"
              />
            ) : (
              <div className="flex flex-col gap-1 p-2 border border-dashed border-blue-400 rounded-md bg-blue-50 flex-grow">
                <span className="text-xs font-semibold text-blue-700">ESPACIO EN BLANCO</span>
                <Input
                  value={answers[part.id!] || ''}
                  onChange={(e) => handleAnswerChange(part.id!, e.target.value)}
                  placeholder="Respuesta correcta..."
                />
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => addPart('text', index)}>+</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addPart('blank', index)}>{"[ ]"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
};