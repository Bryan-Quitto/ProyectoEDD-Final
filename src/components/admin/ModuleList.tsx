import React, { useState, useEffect } from 'react';
import type { Module } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ModuleItem } from './ModuleItem';
import { AddModuleForm } from './AddModuleForm';

interface ModuleListProps {
  courseId: string;
}

export const ModuleList: React.FC<ModuleListProps> = ({ courseId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      setError(null);
      const response = await moduleService.getModulesByCourse(courseId);
      if (response.data) {
        setModules(response.data);
      } else {
        setError(response.error?.message || 'No se pudieron cargar los módulos.');
      }
      setIsLoading(false);
    };

    fetchModules();
  }, [courseId]);

  const handleModuleAdded = (newModule: Module) => {
    setModules(prevModules => [...prevModules, newModule]);
  };

  const handleModuleUpdated = (updatedModule: Module) => {
    setModules(prevModules =>
      prevModules.map(m => (m.id === updatedModule.id ? updatedModule : m))
    );
  };

  const handleModuleDeleted = (moduleId: string) => {
    setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
  };
  
  if (isLoading) {
    return <div className="text-center p-4"><Spinner /></div>;
  }

  if (error) {
    return <Alert variant="destructive" title="Error">{error}</Alert>;
  }
  
  const nextOrderIndex = modules.length > 0 ? Math.max(...modules.map(m => m.order_index)) + 1 : 0;

  return (
    <div className="space-y-6">
      <AddModuleForm
        courseId={courseId}
        onModuleAdded={handleModuleAdded}
        nextOrderIndex={nextOrderIndex}
      />
      
      {modules.length > 0 ? (
        <ul className="space-y-3">
          {modules.map(module => (
            <ModuleItem
              key={module.id}
              module={module}
              onModuleUpdated={handleModuleUpdated}
              onModuleDeleted={handleModuleDeleted}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500">Este curso aún no tiene módulos. ¡Añade el primero!</p>
        </div>
      )}
    </div>
  );
};