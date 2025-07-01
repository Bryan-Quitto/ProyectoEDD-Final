import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';

export const SubmissionController = {
  async submitTextLesson(req: Request, res: Response): Promise<void> {
    const { lessonId, studentId, content } = req.body;

    if (!lessonId || !studentId || !content) {
      res.status(400).json({ data: null, error: { message: 'lessonId, studentId, y content son requeridos.' } });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('text_lesson_submissions')
        .upsert({
          lesson_id: lessonId,
          student_id: studentId,
          content: content,
          status: 'submitted',
        }, { onConflict: 'student_id,lesson_id' })
        .select()
        .single();
      
      if (error) throw error;

      res.status(201).json({ data, error: null });
    } catch (error) {
      res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async getSubmission(req: Request, res: Response): Promise<void> {
    const { lessonId, studentId } = req.params;

    try {
      const { data, error } = await supabase
        .from('text_lesson_submissions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  }
};