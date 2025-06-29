import React, { useState, useEffect, useCallback } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ModuleItem } from './ModuleItem';
import { AddModuleForm } from './AddModuleForm';
import { Button } from '../ui/Button';

interface ModuleListProps {
  courseId: string;
}

export const ModuleList: React.FC<ModuleListProps> = ({ courseId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await moduleService.getModulesByCourse(courseId);
    if (response.data) {
      setModules(response.data.sort((a, b) => a.order_index - b.order_index));
    } else {
      setError(response.error?.message || 'No se pudieron cargar los módulos.');
    }
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleModuleAdded = () => {
    setShowAddForm(false);
    fetchModules();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (error) {
    return <Alert variant="destructive" title="Error">{error}</Alert>;
  }

  const nextOrderIndex = modules.length > 0 ? Math.max(...modules.map(m => m.order_index)) + 1 : 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Contenido del Curso</h2>
        <Button onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? 'Cancelar' : 'Añadir Módulo'}
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 bg-gray-50 border rounded-lg">
          <AddModuleForm
            courseId={courseId}
            onModuleAdded={handleModuleAdded}
            onCancel={() => setShowAddForm(false)}
            nextOrderIndex={nextOrderIndex}
          />
        </div>
      )}

      {modules.length > 0 ? (
        <ul className="space-y-3">
          {modules.map(module => (
            <ModuleItem
              key={module.id}
              module={module}
              onNeedsRefresh={fetchModules}
            />
          ))}
        </ul>
      ) : (
        !showAddForm && (
          <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Este curso aún no tiene módulos. ¡Añade el primero!</p>
          </div>
        )
      )}
    </div>
  );
};