import React, { useState, useEffect } from 'react';

interface FillInTheBlankEditorProps {
  value: any;
  onChange: (value: any) => void;
}

const parseTextToContent = (text: string) => {
  const parts: { type: 'text' | 'blank'; value: string; id?: string }[] = [];
  const answers: Record<string, string> = {};
  const regex = /\[\[(.*?)\]\]/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.substring(lastIndex, match.index) });
    }

    const answer = match[1];
    const blankId = `blank_${match.index}_${Date.now()}`;
    parts.push({ type: 'blank', value: 'Hueco', id: blankId });
    answers[blankId] = answer;
    
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.substring(lastIndex) });
  }

  return { parts, answers };
};

const parseContentToText = (content: any): string => {
  if (!content || !Array.isArray(content.parts) || typeof content.answers !== 'object') {
    return '';
  }
  
  return content.parts.map((part: { type: 'text' | 'blank', value: string, id?: string }) => {
    if (part.type === 'text') {
      return part.value;
    }
    if (part.type === 'blank' && part.id && content.answers[part.id]) {
      return `[[${content.answers[part.id]}]]`;
    }
    return '';
  }).join('');
};

export const FillInTheBlankEditor: React.FC<FillInTheBlankEditorProps> = ({ value, onChange }) => {
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    const textFromValue = parseContentToText(value);
    setRawText(textFromValue);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setRawText(newText);
    const newContent = parseTextToContent(newText);
    onChange(newContent);
  };
  
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <label htmlFor="ftb-editor" className="block text-sm font-medium text-gray-700 mb-1">
        Editor de "Completar Espacios"
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Escribe el texto de la lección. Para crear un espacio en blanco, encierra la respuesta correcta entre dobles corchetes. 
        <br />
        Por ejemplo: <code className="bg-gray-200 px-1 rounded">La capital de Francia es [[París]].</code>
      </p>
      <textarea
        id="ftb-editor"
        value={rawText}
        onChange={handleTextChange}
        rows={8}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Escribe el texto de la lección aquí..."
      />
    </div>
  );
};