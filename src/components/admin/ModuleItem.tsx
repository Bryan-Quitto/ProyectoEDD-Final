import React, { useState, useEffect } from 'react';
import type { Module, Evaluation } from '@plataforma-educativa/types';
import { moduleService } from '../../services/moduleService';
import { evaluationService } from '../../services/evaluationService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LessonList } from './LessonList';
import { ModuleResourcesManager } from './ModuleResourcesManager';
import { ChevronDown, ChevronRight, Edit, Trash2, BookCopy, LifeBuoy, CheckSquare, ShieldQuestion } from 'lucide-react';
import { Alert } from '../ui/Alert';
import toast from 'react-hot-toast';
import { EvaluationBuilderModal } from './EvaluationBuilderModal';

interface ModuleItemProps {
  module: Module;
  onNeedsRefresh: () => void;
}

type ExpandedSection = 'lessons' | 'resources' | null;
type EditingEvaluation = { type: 'diagnostic' | 'project'; data?: Partial<Evaluation> | null } | null;

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onNeedsRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(module.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [diagnosticEval, setDiagnosticEval] = useState<Partial<Evaluation> | null>(null);
  const [finalEval, setFinalEval] = useState<Partial<Evaluation> | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<EditingEvaluation>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
        const [diagRes, finalRes] = await Promise.all([
            evaluationService.getByModuleId(module.id, 'diagnostic'),
            evaluationService.getByModuleId(module.id, 'project')
        ]);
        if (diagRes.data) setDiagnosticEval(diagRes.data);
        if (finalRes.data) setFinalEval(finalRes.data);
    };
    fetchEvaluations();
  }, [module.id]);

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
          <Button variant="destructive" size="sm" onClick={() => { toast.dismiss(t.id); handleDelete(); }}>
            Sí, eliminar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </Button>
        </div>
      </div>
    ), { duration: 6000 });
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
  
  const handleSaveEvaluation = (evalData: Partial<Evaluation>) => {
    if (!editingEvaluation) return;
    
    const payload = { ...evalData, module_id: module.id, evaluation_type: editingEvaluation.type };
    const promise = evaluationService.upsertModuleEvaluation(payload);
    
    toast.promise(promise, {
        loading: 'Guardando evaluación...',
        success: (res) => {
            if (res.error) throw new Error(res.error.message);
            if (editingEvaluation.type === 'diagnostic') {
              setDiagnosticEval(res.data);
            } else {
              setFinalEval(res.data);
            }
            setEditingEvaluation(null);
            return 'Evaluación guardada.';
        },
        error: (err) => err.message,
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setExpandedSection(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedTitle(module.title);
    setError(null);
  }

  const toggleSection = (section: ExpandedSection) => {
    if (isEditing) return;
    setExpandedSection(prev => (prev === section ? null : section));
  };

  return (
    <li className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        {isEditing ? (
          <div className="flex-grow flex items-center space-x-2">
            <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onClick={(e) => e.stopPropagation()} className="flex-grow" autoFocus />
            <Button onClick={handleUpdate} size="sm" isLoading={isSubmitting}>Guardar</Button>
            <Button variant="secondary" size="sm" onClick={handleCancelEdit} disabled={isSubmitting}>Cancelar</Button>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-between">
            <span className="text-gray-800 font-medium">{module.title}</span>
            <div className="space-x-1">
              <Button variant="ghost" size="icon" onClick={handleEditClick} disabled={isSubmitting}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={confirmDelete} isLoading={isSubmitting}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <button onClick={() => toggleSection('lessons')} className={`flex items-center justify-center p-3 text-sm font-medium transition-colors ${expandedSection === 'lessons' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            {expandedSection === 'lessons' ? <ChevronDown className="h-5 w-5 mr-2"/> : <ChevronRight className="h-5 w-5 mr-2"/>}
            <BookCopy className="h-4 w-4 mr-2" /> Lecciones
          </button>
          <button onClick={() => toggleSection('resources')} className={`flex items-center justify-center p-3 text-sm font-medium transition-colors ${expandedSection === 'resources' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            {expandedSection === 'resources' ? <ChevronDown className="h-5 w-5 mr-2"/> : <ChevronRight className="h-5 w-5 mr-2"/>}
            <LifeBuoy className="h-4 w-4 mr-2" /> Recursos de Apoyo
          </button>
          <div className="flex flex-col divide-y divide-gray-200">
            <button onClick={() => setEditingEvaluation({ type: 'diagnostic', data: diagnosticEval })} className="flex-1 flex items-center justify-center p-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <ShieldQuestion className={`h-4 w-4 mr-2 ${diagnosticEval ? 'text-green-600' : 'text-gray-400'}`} /> Prueba Diagnóstico
            </button>
            <button onClick={() => setEditingEvaluation({ type: 'project', data: finalEval })} className="flex-1 flex items-center justify-center p-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <CheckSquare className={`h-4 w-4 mr-2 ${finalEval ? 'text-green-600' : 'text-gray-400'}`} /> Evaluación Final
            </button>
          </div>
        </div>
      </div>
      
      {error && !isEditing && <div className="px-4 pb-2"><Alert variant="destructive">{error}</Alert></div>}
      
      {expandedSection === 'lessons' && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-200">
          <LessonList moduleId={module.id} />
        </div>
      )}
      {expandedSection === 'resources' && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-200">
          <ModuleResourcesManager moduleId={module.id} />
        </div>
      )}
      
      {editingEvaluation && (
        <EvaluationBuilderModal 
            isOpen={!!editingEvaluation}
            onClose={() => setEditingEvaluation(null)}
            onSave={handleSaveEvaluation}
            existingEvaluation={editingEvaluation.data}
            evaluationType={editingEvaluation.type}
            moduleTitle={module.title}
        />
      )}
    </li>
  );
};