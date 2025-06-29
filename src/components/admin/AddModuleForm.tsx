import React, { useState } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService, CreateModuleData } from '../../services/moduleService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';

interface AddModuleFormProps {
  courseId: string;
  onModuleAdded: (newModule: Module) => void;
  nextOrderIndex: number;
}

export const AddModuleForm: React.FC<AddModuleFormProps> = ({ courseId, onModuleAdded, nextOrderIndex }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const newModuleData: CreateModuleData = {
      title,
      course_id: courseId,
      order_index: nextOrderIndex,
      is_active: true,
    };

    const response = await moduleService.createModule(newModuleData);

    if (response.data) {
      onModuleAdded(response.data);
      setTitle('');
    } else {
      setError(response.error?.message || 'Ocurrió un error desconocido.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-700 mb-3">Añadir Nuevo Módulo</h4>
      {error && <Alert variant="destructive" title="Error">{error}</Alert>}
      <div className="flex items-start space-x-3">
        <div className="flex-grow">
          <Input
            id="new-module-title"
            placeholder="Título del nuevo módulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? <Spinner size="sm" /> : 'Añadir'}
        </Button>
      </div>
    </form>
  );
};