import { ApiResponse, Lesson } from '@plataforma-educativa/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type CreateLessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'evaluations' | 'is_completed_by_user'>;
export type UpdateLessonData = Partial<CreateLessonData>;

async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    console.log(`[SERVICE-FE] Respuesta cruda de ${url}:`, { status: response.status, statusText: response.statusText });
    const result = await response.json();

    if (!response.ok) {
      console.error("[SERVICE-FE] Error en la respuesta del servidor:", result);
      return { data: null, error: { message: result.error?.message || result.message || 'Ocurrió un error en el servidor' } };
    }
    
    if(result.error) {
      console.error("[SERVICE-FE] Error de negocio en la respuesta:", result.error);
      return { data: null, error: result.error };
    }

    return { data: result.data || result, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo conectar con el servidor';
    console.error("[SERVICE-FE] Error en el fetch:", e);
    return { data: null, error: { message } };
  }
}

export const lessonService = {
  getLessonById(id: string, studentId?: string): Promise<ApiResponse<Lesson>> {
    let url = `${API_URL}/lessons/${id}`;
    if (studentId) {
      url += `?student_id=${studentId}`;
    }
    return fetchApi<Lesson>(url);
  },
  
  getLessonsByModule(moduleId: string): Promise<ApiResponse<Lesson[]>> {
    return fetchApi<Lesson[]>(`${API_URL}/lessons/module/${moduleId}`);
  },

  createLesson(lessonData: CreateLessonData): Promise<ApiResponse<Lesson>> {
    console.log("[SERVICE-FE] createLesson llamado con:", lessonData);
    return fetchApi<Lesson>(`${API_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    });
  },

  updateLesson(id: string, lessonData: UpdateLessonData): Promise<ApiResponse<Lesson>> {
    return fetchApi<Lesson>(`${API_URL}/lessons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    });
  },

  deleteLesson(id: string): Promise<ApiResponse<Lesson>> {
    return fetchApi<Lesson>(`${API_URL}/lessons/${id}`, {
      method: 'DELETE',
    });
  },
};