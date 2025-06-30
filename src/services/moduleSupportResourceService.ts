import type { ApiResponse, ModuleSupportResource } from '@plataforma-educativa/types';
import { supabase } from './supabase';

type CreateResourceData = Omit<ModuleSupportResource, 'id' | 'created_at' | 'updated_at'>;

export const moduleSupportResourceService = {
  async getByModule(moduleId: string): Promise<ApiResponse<ModuleSupportResource[]>> {
    try {
      const response = await fetch(`/api/module-resources/module/${moduleId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al obtener recursos del módulo');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async create(resourceData: CreateResourceData): Promise<ApiResponse<ModuleSupportResource>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { data: null, error: { message: 'No autenticado' } };

      const response = await fetch(`/api/module-resources/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al crear el recurso');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async remove(resourceId: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { data: null, error: { message: 'No autenticado' } };

      const response = await fetch(`/api/module-resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al eliminar el recurso');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async uploadPdf(file: File): Promise<ApiResponse<{ path: string }>> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `support-pdfs/${fileName}`;

        let { error: uploadError } = await supabase.storage.from('course-materials').upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(filePath);

        return { data: { path: publicUrl }, error: null };
    } catch (error: any) {
        return { data: null, error: { message: error.message } };
    }
  }
};