import api from './api';
import type { ApiResponse, User, PaginatedResponse } from '@plataforma-educativa/types';

const getTeachers = async (): Promise<ApiResponse<User[]>> => {
  return api.get<User[]>('/users/teachers');
};

const getUserById = async (userId: string): Promise<ApiResponse<User>> => {
  return api.get<User>(`/users/${userId}`);
};

const getAllStudents = async (searchTerm: string): Promise<ApiResponse<PaginatedResponse<User>>> => {
  const url = `/users?search=${encodeURIComponent(searchTerm)}`;
  return api.get<PaginatedResponse<User>>(url);
};

export const UserService = {
  getTeachers,
  getUserById,
  getAllStudents,
};