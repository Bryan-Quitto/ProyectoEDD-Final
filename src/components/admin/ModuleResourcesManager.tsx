import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { ModuleSupportResource } from '@plataforma-educativa/types';
import { moduleSupportResourceService } from '../../services/moduleSupportResourceService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Plus, Trash2, Link2, FileText, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { AddResourceModal } from './AddResourceModal';
import { Alert } from '../ui/Alert';

interface ModuleResourcesManagerProps {
  moduleId: string;
}

const ResourceItem: React.FC<{ resource: ModuleSupportResource; onDelete: (id: string) => void; }> = ({ resource, onDelete }) => (
  <li className="flex items-center justify-between p-2 bg-white rounded-md border hover:bg-gray-50">
    <div className="flex items-center gap-2 overflow-hidden">
      {resource.resource_type === 'pdf' ? <FileText className="h-5 w-5 text-red-500 flex-shrink-0" /> : <Link2 className="h-5 w-5 text-blue-500 flex-shrink-0" />}
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-800 truncate hover:underline" title={resource.title}>
        {resource.title}
      </a>
    </div>
    <Button variant="ghost" size="icon" onClick={() => onDelete(resource.id)}>
      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
    </Button>
  </li>
);

export const ModuleResourcesManager: React.FC<ModuleResourcesManagerProps> = ({ moduleId }) => {
  const [resources, setResources] = useState<ModuleSupportResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLevel, setModalLevel] = useState<'low' | 'average'>('low');

  useEffect(() => {
    setIsLoading(true);
    moduleSupportResourceService.getByModule(moduleId)
      .then(res => {
        if (res.data) setResources(res.data);
        else setError(res.error?.message || "Error al cargar recursos.");
      })
      .finally(() => setIsLoading(false));
  }, [moduleId]);

  const { lowPerformanceResources, averagePerformanceResources } = useMemo(() => {
    return {
      lowPerformanceResources: resources.filter(r => r.performance_level === 'low'),
      averagePerformanceResources: resources.filter(r => r.performance_level === 'average'),
    };
  }, [resources]);

  const handleDelete = async (resourceId: string) => {
    const originalResources = resources;
    setResources(prev => prev.filter(r => r.id !== resourceId));
    
    const result = await moduleSupportResourceService.remove(resourceId);
    if (result.error) {
      toast.error("Error al eliminar, restaurando recurso.");
      setResources(originalResources);
    } else {
      toast.success("Recurso eliminado.");
    }
  };

  const openModal = (level: 'low' | 'average') => {
    setModalLevel(level);
    setIsModalOpen(true);
  };
  
  const handleResourceAdded = (newResource: ModuleSupportResource) => {
    setResources(prev => [...prev, newResource]);
  };

  if (isLoading) return <div className="flex justify-center p-4"><Spinner /></div>;
  if (error) return <Alert variant="destructive">{error}</Alert>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna para Rendimiento Bajo */}
        <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-red-800 flex items-center gap-2"><TrendingDown className="h-5 w-5"/> Para Rendimiento Bajo</h4>
            <Button size="sm" variant="outline" onClick={() => openModal('low')}><Plus className="h-4 w-4 mr-1"/> Añadir</Button>
          </div>
          {lowPerformanceResources.length > 0 ? (
            <ul className="space-y-2">{lowPerformanceResources.map(r => <ResourceItem key={r.id} resource={r} onDelete={handleDelete} />)}</ul>
          ) : (
            <div className="text-center text-sm text-red-700/80 py-4"><AlertCircle className="inline-block h-4 w-4 mr-1"/>No hay recursos de apoyo.</div>
          )}
        </div>

        {/* Columna para Rendimiento Promedio */}
        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Para Rendimiento Promedio</h4>
            <Button size="sm" variant="outline" onClick={() => openModal('average')}><Plus className="h-4 w-4 mr-1"/> Añadir</Button>
          </div>
          {averagePerformanceResources.length > 0 ? (
            <ul className="space-y-2">{averagePerformanceResources.map(r => <ResourceItem key={r.id} resource={r} onDelete={handleDelete} />)}</ul>
          ) : (
            <div className="text-center text-sm text-blue-700/80 py-4"><AlertCircle className="inline-block h-4 w-4 mr-1"/>No hay recursos de apoyo.</div>
          )}
        </div>
      </div>
      
      <AddResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResourceAdded={handleResourceAdded}
        moduleId={moduleId}
        performanceLevel={modalLevel}
      />
    </>
  );
};