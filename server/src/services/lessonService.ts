import { supabase } from '../config/supabaseAdmin';
import type { Lesson, ApiResponse } from '@plataforma-educativa/types';

type CreateLessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'evaluations' | 'is_completed_by_user'>;
type UpdateLessonData = Partial<CreateLessonData>;

export class LessonService {
  async create(lessonData: CreateLessonData): Promise<ApiResponse<Lesson>> {
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
  }

  async getById(id: string): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lección no encontrada';
      return { data: null, error: { message } };
    }
  }

  async getByModuleId(moduleId: string): Promise<ApiResponse<Lesson[]>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener lecciones del módulo';
      return { data: null, error: { message } };
    }
  }

  async update(id: string, lessonData: UpdateLessonData): Promise<ApiResponse<Lesson>> {
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
  }

  async remove(id: string): Promise<ApiResponse<Lesson>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la lección';
      return { data: null, error: { message } };
    }
  }
}