import React, { useState } from 'react';
import type { Module, LessonWithSubmission } from '@plataforma-educativa/types';
import { ChevronDown, FileText, CheckCircle, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { GradeSubmissionModal } from './GradeSubmissionModal';

interface StudentProgressModuleAccordionProps {
  module: Omit<Module, 'lessons'> & { lessons: LessonWithSubmission[] };
  onGradeUpdate: (lessonId: string, updatedSubmission: any) => void;
}

export const StudentProgressModuleAccordion: React.FC<StudentProgressModuleAccordionProps> = ({ module, onGradeUpdate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithSubmission | null>(null);

  const handleGradeClick = (lesson: LessonWithSubmission) => {
    setSelectedLesson(lesson);
  };

  const handleModalClose = () => {
    setSelectedLesson(null);
  };
  
  const handleModalSave = (updatedSubmission: any) => {
    onGradeUpdate(selectedLesson!.id, updatedSubmission);
    handleModalClose();
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
        >
          <h3 className="font-semibold text-gray-800 text-left">{module.title}</h3>
          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <ul className="divide-y divide-gray-200">
            {module.lessons.sort((a, b) => a.order_index - b.order_index).map(lesson => (
              <li key={lesson.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-800">{lesson.title}</span>
                </div>
                <div>
                  {lesson.submission ? (
                    lesson.submission.status === 'graded' ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5" />
                        <span>Calificado: {lesson.submission.score}/100</span>
                        <Button variant="outline" size="sm" onClick={() => handleGradeClick(lesson)}>
                          <Edit className="h-4 w-4 mr-1"/> Ver/Editar
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleGradeClick(lesson)}>
                        Calificar Tarea
                      </Button>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 italic">No entregado</span>
                  )}
                </div>
              </li>
            ))}
            {module.lessons.length === 0 && (
                <li className="p-4 text-center text-sm text-gray-500">Este módulo no tiene lecciones.</li>
            )}
          </ul>
        )}
      </div>
      {selectedLesson && selectedLesson.submission && (
        <GradeSubmissionModal
          isOpen={!!selectedLesson}
          onClose={handleModalClose}
          onSave={handleModalSave}
          lesson={selectedLesson}
          submission={selectedLesson.submission}
        />
      )}
    </>
  );
};