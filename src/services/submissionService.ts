import api from './api';
import type { ApiResponse } from '@plataforma-educativa/types';

// Suponiendo que tienes un tipo TextLessonSubmission en @plataforma-educativa/types
// Si no, lo añadiremos después.
interface TextLessonSubmission {
  id: string;
  lesson_id: string;
  student_id: string;
  content: string;
  status: 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
}

export const submissionService = {
  async submitTextLesson(lessonId: string, studentId: string, content: string): Promise<ApiResponse<TextLessonSubmission>> {
    const payload = { lessonId, studentId, content };
    return api.post<TextLessonSubmission>('/submissions', payload);
  },

  async getSubmission(lessonId: string, studentId: string): Promise<ApiResponse<TextLessonSubmission | null>> {
    return api.get<TextLessonSubmission | null>(`/submissions/lesson/${lessonId}/student/${studentId}`);
  }
};