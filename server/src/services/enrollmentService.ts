import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, Enrollment, User } from '@plataforma-educativa/types';

type EnrollmentData = {
  student_id: string;
  course_id: string;
};

export class EnrollmentService {
  async create(data: EnrollmentData): Promise<ApiResponse<Enrollment>> {
    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: { message: 'Ya estás inscrito en este curso.', status: 409 } };
      }
      return { data: null, error: { message: error.message, status: 500 } };
    }

    return { data: newEnrollment, error: null };
  }

  async delete(data: EnrollmentData): Promise<ApiResponse<{ message: string }>> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', data.student_id)
      .eq('course_id', data.course_id);

    if (error) {
      return { data: null, error: { message: error.message, status: 500 } };
    }

    return { data: { message: 'Inscripción cancelada con éxito.' }, error: null };
  }

  async getStudentsByCourse(courseId: string): Promise<ApiResponse<User[]>> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        profiles (*)
      `)
      .eq('course_id', courseId);
    
    if (error) {
      return { data: null, error: { message: error.message } };
    }

    const nestedProfiles = data?.map(e => e.profiles) ?? [];
    const students = nestedProfiles.flat().filter(Boolean) as User[];
    
    return { data: students, error: null };
  }
}