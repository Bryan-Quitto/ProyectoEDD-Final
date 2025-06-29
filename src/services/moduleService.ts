import { ApiResponse, Module } from '@plataforma-educativa/types';
import { supabase } from './supabase';

const API_URL = '/api';

export type CreateModuleData = {
  title: string;
  description?: string | null;
  course_id: string;
  order_index: number;
  is_active?: boolean;
};

export type UpdateModuleData = {
  title?: string;
  description?: string | null;
  order_index?: number;
  is_active?: boolean;
};

export const moduleService = {
  async getModulesByCourse(courseId: string): Promise<ApiResponse<Module[]>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener los módulos';
      console.error(message);
      return { data: null, error: { message } };
    }
  },

  async createModule(moduleData: CreateModuleData): Promise<ApiResponse<Module>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([moduleData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el módulo';
      console.error(message);
      return { data: null, error: { message } };
    }
  },

  async updateModule(id: string, moduleData: UpdateModuleData): Promise<ApiResponse<Module>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update(moduleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el módulo';
      console.error(message);
      return { data: null, error: { message } };
    }
  },

  async deleteModule(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el módulo';
      console.error(message);
      return { data: null, error: { message, status: 500 } };
    }
  },
};