import { supabase } from "./supabase";
import type { Course, CourseDetails, CourseFilters, ApiResponse } from "../types";

const getAllCourses = async (filters: CourseFilters = {}): Promise<ApiResponse<Course[]>> => {
    let query = supabase
        .from('courses')
        .select(`
            id,
            title,
            description,
            difficulty_level,
            estimated_duration,
            is_active,
            created_at,
            updated_at,
            teacher_id,
            image_url,
            users (full_name)
        `)
        .eq('is_active', true);

    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
    }
    
    const { data, error } = await query;

    if (data) {
        const formattedData = data.map(course => ({
            ...course,
            // @ts-ignore
            instructor_name: course.users?.full_name || 'N/A'
        }));
        // @ts-ignore
        return { data: formattedData, error: null };
    }
    
    return { data, error };
};

const getCourseById = async (id: string): Promise<ApiResponse<CourseDetails>> => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            instructor_name:users(full_name),
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
        
    if (data) {
        const formattedData = {
            ...data,
            // @ts-ignore
            instructor_name: data.users?.full_name || 'N/A'
        };
        // @ts-ignore
        return { data: formattedData as CourseDetails | null, error };
    }

    return { data: null, error };
};

export const CourseService = {
    getAllCourses,
    getCourseById
};