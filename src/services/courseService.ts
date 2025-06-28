import axios from 'axios';
import type { Course, Module, ApiResponse, PaginatedResponse, CourseFilters } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class CourseService {
  static async getAllCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/courses?${params.toString()}`);
    return response.data;
  }

  static async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }

  static async getCourseModules(courseId: string): Promise<ApiResponse<Module[]>> {
    const response = await api.get(`/courses/${courseId}/modules`);
    return response.data;
  }

  static async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Course>> {
    const response = await api.post('/courses', course);
    return response.data;
  }

  static async updateCourse(id: string, course: Partial<Course>): Promise<ApiResponse<Course>> {
    const response = await api.put(`/courses/${id}`, course);
    return response.data;
  }

  static async deleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  }
}