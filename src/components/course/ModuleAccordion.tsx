import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { Module, Lesson, Evaluation, EvaluationAttempt } from '@plataforma-educativa/types';
import { evaluationService } from '../../services/evaluationService';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, CheckCircle, ChevronDown, Film, FileText, Puzzle, ShieldCheck } from 'lucide-react';

interface ModuleAccordionProps {
  module: Module;
  courseId: string;
}

const getLessonIcon = (lessonType: string) => {
  switch(lessonType) {
    case 'video': return <Film className="h-4 w-4 text-gray-500" />;
    case 'text': return <FileText className="h-4 w-4 text-gray-500" />;
    case 'quiz': return <Puzzle className="h-4 w-4 text-gray-500" />;
    default: return <BookOpen className="h-4 w-4 text-gray-500" />;
  }
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ module, courseId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [moduleEvaluation, setModuleEvaluation] = useState<Evaluation | null>(null);
  const [lastAttempt, setLastAttempt] = useState<EvaluationAttempt | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchModuleEval = async () => {
      if (!user) return;
      const { data: evalData } = await evaluationService.getByModuleId(module.id);
      if (evalData) {
        setModuleEvaluation(evalData);
        const { data: attemptData } = await evaluationService.getAttemptsHistory(evalData.id, user.id);
        if (attemptData && attemptData.length > 0) {
          setLastAttempt(attemptData[attemptData.length - 1]);
        }
      }
    };
    fetchModuleEval();
  }, [module.id, user]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-800">{module.title}</h3>
          <p className="text-sm text-gray-500">{module.lessons?.length || 0} lecciones</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="bg-white divide-y divide-gray-200">
          {module.lessons && module.lessons.length > 0 ? (
            module.lessons
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
            <li className="p-4 text-sm text-gray-500">No hay lecciones en este módulo.</li>
          )}
          
          {moduleEvaluation && (
            <li className="bg-gray-50">
              <Link to={`/course/${courseId}/module/${module.id}/evaluation`} className="flex items-center justify-between p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /><span>Evaluación Final del Módulo</span></div>
                {lastAttempt && (
                  <span className={`px-2 py-1 text-xs rounded-full ${lastAttempt.passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {lastAttempt.percentage}%
                  </span>
                )}
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};