import { ApiResponse, Lesson } from '@plataforma-educativa/types';
import { supabase } from './supabase';

export type CreateLessonData = {
  title: string;
  module_id: string;
  order_index: number;
  lesson_type: 'video' | 'text' | 'interactive' | 'quiz';
  estimated_duration: number;
  content?: string | null;
  is_active?: boolean;
};

export type UpdateLessonData = Partial<Omit<CreateLessonData, 'module_id'>>;

export const lessonService = {
  async getLessonsByModule(moduleId: string): Promise<ApiResponse<Lesson[]>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener las lecciones';
      return { data: null, error: { message } };
    }
  },

  async createLesson(lessonData: CreateLessonData): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la lección';
      return { data: null, error: { message } };
    }
  },

  async updateLesson(id: string, lessonData: UpdateLessonData): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la lección';
      return { data: null, error: { message } };
    }
  },

  async deleteLesson(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la lección';
      return { data: null, error: { message, status: 500 } };
    }
  },
};