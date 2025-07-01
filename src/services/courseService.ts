import { supabase } from "./supabase";
import type { Course, CourseDetails, CourseFilters, ApiResponse, PaginatedResponse } from "@plataforma-educativa/types";
import api from './api';

const getAllCourses = async (filters: CourseFilters = {}): Promise<ApiResponse<PaginatedResponse<Course>>> => {
    try {
      const params = new URLSearchParams(filters as any).toString();
      
      const response = await api.get<PaginatedResponse<Course>>(`/courses?${params}`);
      
      return response;
    } catch (error: any) {
      const message = "Error al obtener los cursos";
      return { data: null, error: { message } };
    }
};

const getCourseById = async (id: string, studentId?: string): Promise<ApiResponse<CourseDetails>> => {
    let url = `/courses/${id}`;
    if (studentId) {
      url += `?student_id=${studentId}`;
    }
    return api.get<CourseDetails>(url);
};


const getCoursesByTeacher = async (teacherId: string): Promise<ApiResponse<Course[]>> => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles (full_name)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  const coursesWithInstructorName = data?.map(course => {
    const { profiles, ...restOfCourse } = course as any;
    return {
      ...restOfCourse,
      instructor_name: profiles?.full_name || 'Profesor Desconocido'
    };
  }) || [];

  return { data: coursesWithInstructorName, error: null };
};

const getEnrolledCourses = async (studentId: string): Promise<ApiResponse<Course[]>> => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          courses (
            *
          )
        `)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      const nestedCourses = data?.map(enrollment => enrollment.courses) ?? [];
      const courses: Course[] = nestedCourses.flat().filter(Boolean) as Course[];
      
      return { data: courses, error: null };

    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Error al obtener los cursos inscritos.' } };
    }
};

export type CourseFormData = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'instructor_name' | 'total_lessons' | 'completed_lessons'>;

const createCourse = async (courseData: CourseFormData): Promise<ApiResponse<Course>> => {
    return api.post<Course>('/courses', courseData);
};

const updateCourse = async (id: string, courseData: Partial<CourseFormData>): Promise<ApiResponse<Course>> => {
    return api.put<Course>(`/courses/${id}`, courseData);
};

export const CourseService = {
    getAllCourses,
    getCourseById,
    getCoursesByTeacher,
    getEnrolledCourses,
    createCourse,
    updateCourse
};