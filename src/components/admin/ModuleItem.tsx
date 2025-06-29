import React, { useState } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ModuleItemProps {
  module: Module;
  onModuleUpdated: (updatedModule: Module) => void;
  onModuleDeleted: (moduleId: string) => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onModuleUpdated, onModuleDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(module.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!editedTitle.trim()) {
      setError('El título no puede estar vacío.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const response = await moduleService.updateModule(module.id, { title: editedTitle });
    if (response.data) {
      onModuleUpdated(response.data);
      setIsEditing(false);
    } else {
      setError(response.error?.message || 'Error al actualizar.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el módulo "${module.title}"?`)) {
      setIsSubmitting(true);
      const response = await moduleService.deleteModule(module.id);
      if (response.data) {
        onModuleDeleted(module.id);
      } else {
        setError(response.error?.message || 'Error al eliminar.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <li className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center justify-between">
      {isEditing ? (
        <div className="flex-grow flex items-center space-x-2">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleUpdate} size="sm" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Guardar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-between">
          <span className="text-gray-800 font-medium">{module.title}</span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Eliminar'}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1 w-full">{error}</p>}
    </li>
  );
};