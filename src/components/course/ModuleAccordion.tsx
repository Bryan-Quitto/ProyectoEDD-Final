import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { Module, Lesson, Evaluation, ModuleProgress } from '@plataforma-educativa/types';
import { BookOpen, CheckCircle, ChevronDown, Film, FileText, Puzzle, ShieldCheck, ShieldQuestion } from 'lucide-react';

interface ModuleAccordionProps {
  module: Module;
  courseId: string;
  diagnosticEval: Evaluation | null;
  finalEval: Evaluation | null;
  moduleProgress: ModuleProgress | null;
}

const getLessonIcon = (lessonType: string) => {
  switch(lessonType) {
    case 'video': return <Film className="h-4 w-4 text-gray-500" />;
    case 'text': return <FileText className="h-4 w-4 text-gray-500" />;
    case 'fill_in_the_blank': return <Puzzle className="h-4 w-4 text-gray-500" />;
    case 'quiz': return <ShieldQuestion className="h-4 w-4 text-gray-500" />;
    default: return <BookOpen className="h-4 w-4 text-gray-500" />;
  }
}

const getVisibleLessons = (module: Module, moduleProgress: ModuleProgress | null): Lesson[] => {
  const diagnosticLevel = moduleProgress?.diagnostic_level;
  if (!diagnosticLevel) return []; // No mostrar lecciones si no se ha hecho el diagnóstico

  const allLessons = module.lessons || [];

  switch(diagnosticLevel) {
    case 'low':
      return allLessons.filter(l => l.target_level === 'remedial' || l.target_level === 'core');
    case 'average':
      return allLessons.filter(l => l.target_level === 'core');
    case 'high':
      return allLessons.filter(l => l.target_level === 'core' || l.target_level === 'advanced');
    default:
      return [];
  }
};

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ module, courseId, diagnosticEval, finalEval, moduleProgress }) => {
  const [isOpen, setIsOpen] = useState(true);

  const needsToTakeDiagnostic = !!diagnosticEval && !moduleProgress?.diagnostic_level;
  const visibleLessons = getVisibleLessons(module, moduleProgress);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-800">{module.title}</h3>
          <p className="text-sm text-gray-500">{module.lessons?.length || 0} lecciones totales</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="bg-white divide-y divide-gray-200">
          {needsToTakeDiagnostic && (
            <li className="bg-amber-50">
              <Link to={`/course/${courseId}/module/${module.id}/evaluation?type=diagnostic`} className="flex items-center justify-center p-4 text-sm font-semibold text-amber-800 hover:bg-amber-100">
                <ShieldQuestion className="h-5 w-5 mr-2" />
                Empezar Prueba de Diagnóstico (Requerido)
              </Link>
            </li>
          )}

          {visibleLessons.length > 0 ? (
            visibleLessons
              .sort((a, b) => a.order_index - b.order_index)
              .map((lesson: Lesson) => (
                <li key={lesson.id}>
                  <NavLink
                    to={`/course/${courseId}/lesson/${lesson.id}`}
                    className={({ isActive }) => `flex items-center justify-between p-4 text-sm hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                  >
                    <div className="flex items-center space-x-3">{getLessonIcon(lesson.lesson_type)}<span>{lesson.title}</span></div>
                    <div className="flex items-center space-x-2">{lesson.is_completed_by_user && <CheckCircle className="h-5 w-5 text-green-500" />}</div>
                  </NavLink>
                </li>
              ))
          ) : (
            !needsToTakeDiagnostic && <li className="p-4 text-sm text-gray-500">Ruta de aprendizaje completada para este módulo.</li>
          )}
          
          {finalEval && !needsToTakeDiagnostic && (
            <li className="bg-gray-50">
              <Link to={`/course/${courseId}/module/${module.id}/evaluation?type=project`} className="flex items-center justify-between p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /><span>Evaluación Final del Módulo</span></div>
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};