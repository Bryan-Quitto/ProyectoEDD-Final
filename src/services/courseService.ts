import { supabase } from "./supabase";
import type { Course, CourseDetails, CourseFilters, ApiResponse } from "@plataforma-educativa/types";

type PartialCourse = Pick<Course, 'id' | 'title' | 'is_active' | 'created_at'>;

const getAllCourses = async (filters: CourseFilters = {}): Promise<ApiResponse<Course[]>> => {
    const query = supabase
        .from('courses')
        .select(`
            id, title, description, difficulty_level, estimated_duration,
            is_active, created_at, updated_at, teacher_id, image_url,
            users (full_name)
        `)
        .eq('is_active', true);

    if (filters.search) {
        query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.difficulty) {
        query.eq('difficulty_level', filters.difficulty);
    }
    
    const { data, error } = await query;

    if (error) {
        return { data: null, error: { message: error.message } };
    }

    if (data) {
        const formattedData: Course[] = data.map(course => {
            const { users, ...rest } = course;
            const instructor = Array.isArray(users) ? users[0] : users;
            return {
                ...rest,
                instructor_name: (instructor as { full_name: string } | null)?.full_name || 'Profesor Desconocido'
            };
        });
        return { data: formattedData, error: null };
    }
    
    return { data: [], error: null };
};

const getCourseById = async (id: string): Promise<ApiResponse<CourseDetails>> => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *, 
            users(full_name),
            modules (
                *,
                lessons (
                    *,
                    evaluations (id, title)
                )
            )
        `)
        .eq('id', id)
        .single();
        
    if (error) {
        return { data: null, error: { message: error.message } };
    }

    if (data) {
        const { users, ...rest } = data;
        const instructor = Array.isArray(users) ? users[0] : users;
        const formattedData = {
            ...rest,
            instructor_name: (instructor as { full_name: string } | null)?.full_name || 'Profesor Desconocido'
        };
        return { data: formattedData as CourseDetails, error: null };
    }

    return { data: null, error: null };
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


export type CourseFormData = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'instructor_name' | 'total_lessons' | 'completed_lessons'>;

const createCourse = async (courseData: CourseFormData): Promise<ApiResponse<Course>> => {
  // Aquí llamaríamos al endpoint del backend
  // Por ahora, simulamos la llamada a Supabase directamente para simplificar
  // Idealmente esto sería una llamada a nuestro propio /api/courses
  const { data, error } = await supabase
    .from('courses')
    .insert([courseData])
    .select()
    .single();
  
  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data, error: null };
};

const updateCourse = async (id: string, courseData: Partial<CourseFormData>): Promise<ApiResponse<Course>> => {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data, error: null };
};

export const CourseService = {
    getAllCourses,
    getCourseById,
    getCoursesByTeacher,
    createCourse,
    updateCourse
};