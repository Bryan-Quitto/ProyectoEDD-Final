import { supabase } from './supabase';
import type { ApiResponse } from '@plataforma-educativa/types';

// Asumimos que el tipo CourseResource se añadirá a @plataforma-educativa/types
export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  resource_type: 'pdf' | 'url' | 'video';
  url: string;
  created_at: string;
}

const BUCKET_NAME = 'course-resources';

export const resourceService = {
  async getResourcesByCourse(courseId: string): Promise<ApiResponse<CourseResource[]>> {
    try {
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: null, error: { message: 'Error al cargar los recursos' } };
    }
  },

  async uploadResourceFile(courseId: string, file: File): Promise<string> {
    const filePath = `${courseId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async createResourceEntry(resourceData: Omit<CourseResource, 'id' | 'created_at'>): Promise<ApiResponse<CourseResource>> {
    try {
      const { data, error } = await supabase
        .from('course_resources')
        .insert(resourceData)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: 'Error al crear el registro del recurso' } };
    }
  },

  async deleteResource(resourceId: string, resourceUrl: string): Promise<ApiResponse<null>> {
    try {
      // Extraer el path del archivo desde la URL pública
      const filePath = resourceUrl.substring(resourceUrl.indexOf(`/${BUCKET_NAME}/`) + `/${BUCKET_NAME}/`.length);
      
      // Borrar el archivo del storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.error("Error borrando del storage, pero se continuará borrando de la BD:", storageError);
      }
      
      // Borrar el registro de la base de datos
      const { error: dbError } = await supabase
        .from('course_resources')
        .delete()
        .eq('id', resourceId);
      
      if (dbError) throw dbError;

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: 'Error al eliminar el recurso' } };
    }
  }
};