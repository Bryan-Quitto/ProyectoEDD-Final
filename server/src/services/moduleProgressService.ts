import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, ModuleProgress } from '@plataforma-educativa/types';

type ModuleProgressData = Partial<Omit<ModuleProgress, 'id' | 'created_at' | 'updated_at' | 'student_id' | 'module_id'>>;

export class ModuleProgressService {
  async get(studentId: string, moduleId: string): Promise<ApiResponse<ModuleProgress | null>> {
    try {
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener el progreso del módulo.';
      return { data: null, error: { message } };
    }
  }

  async upsert(studentId: string, moduleId: string, progressData: ModuleProgressData): Promise<ApiResponse<ModuleProgress>> {
    try {
      const payload = {
        student_id: studentId,
        module_id: moduleId,
        ...progressData,
      };

      const { data, error } = await supabase
        .from('module_progress')
        .upsert(payload, { onConflict: 'student_id,module_id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar el progreso del módulo.';
      return { data: null, error: { message } };
    }
  }
}