import { supabase } from "./supabase";
import type { Course, CourseDetails, CourseFilters, ApiResponse } from "@plataforma-educativa/types";
import axios from 'axios';

type PartialCourse = Pick<Course, 'id' | 'title' | 'is_active' | 'created_at'>;

const API_BASE_URL = '/api';

const getAllCourses = async (filters: CourseFilters = {}): Promise<ApiResponse<Course[]>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`, { params: filters });
      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al obtener los cursos";
      return { data: null, error: { message } };
    }
};

const getCourseById = async (id: string): Promise<ApiResponse<CourseDetails>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${id}`);
      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al obtener el detalle del curso";
      return { data: null, error: { message } };
    }
};

const getCoursesByTeacher = async (teacherId: string): Promise<ApiResponse<PartialCourse[]>> => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, is_active, created_at')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: data || [], error: null };
};

const getEnrolledCourses = async (studentId: string): Promise<ApiResponse<Course[]>> => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      const courses = data ? data.map(enrollment => enrollment.courses).filter(Boolean) as Course[] : [];
      return { data: courses, error: null };

    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Error al obtener los cursos inscritos.' } };
    }
};

export type CourseFormData = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'instructor_name' | 'total_lessons' | 'completed_lessons'>;

const createCourse = async (courseData: CourseFormData): Promise<ApiResponse<Course>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al crear el curso";
      return { data: null, error: { message } };
    }
};

const updateCourse = async (id: string, courseData: Partial<CourseFormData>): Promise<ApiResponse<Course>> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/courses/${id}`, courseData);
      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al actualizar el curso";
      return { data: null, error: { message } };
    }
};

export const CourseService = {
    getAllCourses,
    getCourseById,
    getCoursesByTeacher,
    getEnrolledCourses,
    createCourse,
    updateCourse
};