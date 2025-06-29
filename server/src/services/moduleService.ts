import { supabase } from '../config/supabase';
import type { Module } from '@plataforma-educativa/types';

type CreateModuleData = Omit<Module, 'id' | 'created_at' | 'updated_at' | 'lessons'>;
type UpdateModuleData = Partial<CreateModuleData>;

export const ModuleService = {
  async create(moduleData: CreateModuleData): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .insert([moduleData])
      .select()
      .single();

    if (error) {
      console.error('Error creando módulo:', error);
      throw new Error(`Error al crear el módulo: ${error.message}`);
    }
    return data;
  },

  async getByCourseId(courseId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error(`Error obteniendo módulos para el curso ${courseId}:`, error);
      throw new Error(`Error al obtener los módulos: ${error.message}`);
    }
    return data || [];
  },
  
  async getById(id: string): Promise<Module | null> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error(`Error obteniendo módulo ${id}:`, error);
        throw new Error(`Error al obtener el módulo: ${error.message}`);
    }
    return data;
  },

  async update(id: string, moduleData: UpdateModuleData): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .update(moduleData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error actualizando módulo ${id}:`, error);
      throw new Error(`Error al actualizar el módulo: ${error.message}`);
    }
    return data;
  },

  async remove(id: string): Promise<Module> {
    const toDelete = await this.getById(id);
    if (!toDelete) {
        throw new Error(`Módulo con ID ${id} no encontrado para eliminar.`);
    }
      
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error eliminando módulo ${id}:`, error);
      throw new Error(`Error al eliminar el módulo: ${error.message}`);
    }
    return toDelete;
  },
};