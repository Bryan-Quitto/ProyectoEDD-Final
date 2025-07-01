import type { ApiResponse, Enrollment, User } from '@plataforma-educativa/types';
import api from './api';

const enrollInCourse = async (studentId: string, courseId: string): Promise<ApiResponse<Enrollment>> => {
  return api.post<Enrollment>('/enrollments', { student_id: studentId, course_id: courseId });
};

const unenrollFromCourse = async (studentId: string, courseId: string): Promise<ApiResponse<{ message: string }>> => {
  return api.delete<{ message: string }>('/enrollments', { student_id: studentId, course_id: courseId });
};

const getStudentsByCourse = async (courseId: string): Promise<ApiResponse<User[]>> => {
  return api.get<User[]>(`/enrollments/course/${courseId}/students`);
};

export const EnrollmentService = {
  enrollInCourse,
  unenrollFromCourse,
  getStudentsByCourse,
};