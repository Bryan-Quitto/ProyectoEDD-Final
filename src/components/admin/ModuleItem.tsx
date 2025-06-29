import React, { useState } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { LessonList } from './LessonList';

interface ModuleItemProps {
  module: Module;
  onModuleUpdated: (updatedModule: Module) => void;
  onModuleDeleted: (moduleId: string) => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onModuleUpdated, onModuleDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedTitle, setEditedTitle] = useState(module.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!editedTitle.trim()) return;
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Seguro que quieres eliminar el módulo "${module.title}" y todas sus lecciones?`)) {
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

  const toggleExpansion = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsExpanded(false);
  };

  return (
    <li className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={toggleExpansion}
      >
        {isEditing ? (
          <div className="flex-grow flex items-center space-x-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-grow"
            />
            <Button onClick={handleUpdate} size="sm" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Guardar'}
            </Button>
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-between">
            <div className="flex items-center">
                <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="ml-3 text-gray-800 font-medium">{module.title}</span>
            </div>
            <div className="space-x-2">
              <Button variant="secondary" size="sm" onClick={handleEditClick} disabled={isSubmitting}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : 'Eliminar'}
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs p-4 pt-0">{error}</p>}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <LessonList moduleId={module.id} />
        </div>
      )}
    </li>
  );
};