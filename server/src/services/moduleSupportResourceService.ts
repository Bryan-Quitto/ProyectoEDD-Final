import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, ModuleSupportResource } from '@plataforma-educativa/types';

type CreateResourceData = Omit<ModuleSupportResource, 'id' | 'created_at' | 'updated_at'>;

export class ModuleSupportResourceService {

  async getResourcesByModule(moduleId: string): Promise<ApiResponse<ModuleSupportResource[]>> {
    try {
      const { data, error } = await supabase
        .from('module_support_resources')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener los recursos del módulo.';
      return { data: null, error: { message } };
    }
  }

  async createResource(resourceData: CreateResourceData): Promise<ApiResponse<ModuleSupportResource>> {
    try {
      const { data, error } = await supabase
        .from('module_support_resources')
        .insert(resourceData)
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el recurso de apoyo.';
      return { data: null, error: { message } };
    }
  }

  async deleteResource(resourceId: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from('module_support_resources')
        .delete()
        .eq('id', resourceId)
        .select('id')
        .single();
        
      if (error) throw error;
      if (!data) return { data: null, error: { message: 'Recurso no encontrado para eliminar.' } };
      
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el recurso de apoyo.';
      return { data: null, error: { message } };
    }
  }
}