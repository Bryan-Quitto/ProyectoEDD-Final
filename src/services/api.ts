import { supabase } from './supabase';
import type { ApiResponse } from '@plataforma-educativa/types';

const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

const api = {
  async request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      const options: RequestInit = {
        method,
        headers,
      };

      if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, options);

      const responseText = await response.text();
      console.log(`[API WRAPPER] Respuesta cruda del servidor para ${method} ${endpoint}:`, responseText);

      const result: ApiResponse<T> = JSON.parse(responseText);
      
      if (!response.ok) {
        throw new Error(result.error?.message || `Error en la petición ${method} a ${endpoint}`);
      }

      console.log(`[API WRAPPER] Respuesta parseada exitosa para ${method} ${endpoint}:`, result);
      return result;

    } catch (error) {
      console.error(`[API WRAPPER] Error en la petición para ${method} ${endpoint}:`, error);
      return { data: null, error: { message: (error as Error).message } };
    }
  },

  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  },

  post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  },

  patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  },

  put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  },

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
};

export default api;