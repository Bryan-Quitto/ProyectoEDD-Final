import type { ApiResponse, Enrollment, User } from '@plataforma-educativa/types';
import axios from 'axios';

const API_BASE_URL = '/api';

const enrollInCourse = async (studentId: string, courseId: string): Promise<ApiResponse<Enrollment>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/enrollments`, {
      student_id: studentId,
      course_id: courseId,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error?.message || "Error al realizar la inscripción";
    return { data: null, error: { message, status: error.response?.status } };
  }
};

const getStudentsByCourse = async (courseId: string): Promise<ApiResponse<User[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/enrollments/course/${courseId}/students`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error?.message || "Error al obtener los estudiantes del curso";
    return { data: null, error: { message, status: error.response?.status } };
  }
};

export const EnrollmentService = {
  enrollInCourse,
  getStudentsByCourse,
};