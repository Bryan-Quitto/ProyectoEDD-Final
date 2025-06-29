import { ApiResponse, StudentStats } from '@plataforma-educativa/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: result.error?.message || 'Ocurrió un error en el servidor' } };
    }
    
    if(result.error) {
       return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo conectar con el servidor';
    return { data: null, error: { message } };
  }
}

export const performanceService = {
  getStudentStats(studentId: string): Promise<ApiResponse<StudentStats>> {
    return fetchApi<StudentStats>(`${API_URL}/performance/stats/${studentId}`);
  },
};