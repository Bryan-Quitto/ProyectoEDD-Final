import React, { useState } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { LessonList } from './LessonList';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Alert } from '../ui/Alert';
import toast from 'react-hot-toast';

interface ModuleItemProps {
  module: Module;
  onNeedsRefresh: () => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onNeedsRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedTitle, setEditedTitle] = useState(module.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!editedTitle.trim()) {
      toast.error("El título no puede estar vacío.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const promise = moduleService.updateModule(module.id, { title: editedTitle });
    
    toast.promise(promise, {
      loading: 'Actualizando módulo...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        onNeedsRefresh();
        setIsEditing(false);
        setIsSubmitting(false);
        return 'Módulo actualizado.';
      },
      error: (err) => {
        setError(err.message);
        setIsSubmitting(false);
        return err.message;
      }
    });
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast((t) => (
      <div className='flex flex-col gap-2'>
        <p>¿Seguro que quieres eliminar el módulo <strong>"{module.title}"</strong>?</p>
        <div className='flex gap-2'>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              toast.dismiss(t.id);
              handleDelete();
            }}
          >
            Sí, eliminar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ), {
      duration: 6000,
    });
  };

  const handleDelete = async () => {
    setError(null);
    setIsSubmitting(true);
    const promise = moduleService.deleteModule(module.id);

    toast.promise(promise, {
      loading: 'Eliminando módulo...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        onNeedsRefresh();
        return 'Módulo eliminado.';
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message;
      }
    });
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

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedTitle(module.title);
    setError(null);
  }

  return (
    <li className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
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
              autoFocus
            />
            <Button onClick={handleUpdate} size="sm" isLoading={isSubmitting}>
              Guardar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCancelEdit} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-between">
            <div className="flex items-center">
                {isExpanded ? <ChevronDown className="h-5 w-5 mr-3 text-gray-500"/> : <ChevronRight className="h-5 w-5 mr-3 text-gray-500"/>}
                <span className="text-gray-800 font-medium">{module.title}</span>
            </div>
            <div className="space-x-1">
              <Button variant="ghost" size="icon" onClick={handleEditClick} disabled={isSubmitting}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={confirmDelete} isLoading={isSubmitting}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && !isEditing && <div className="px-4 pb-2"><Alert variant="destructive">{error}</Alert></div>}
      {isExpanded && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-200">
          <LessonList moduleId={module.id} />
        </div>
      )}
    </li>
  );
};