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
      
      const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;

      const response = await fetch(fullUrl, options);

      const responseText = await response.text();

      const result: ApiResponse<T> = JSON.parse(responseText);
      
      if (!response.ok) {
        throw new Error(result.error?.message || `Error en la petición ${method} a ${endpoint}`);
      }

      return result;

    } catch (error) {
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

  delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, body);
  }
};

export default api;