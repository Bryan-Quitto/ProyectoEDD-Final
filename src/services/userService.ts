import type { ApiResponse, User } from '@plataforma-educativa/types';
import axios from 'axios';

const API_BASE_URL = '/api';

type Teacher = Pick<User, 'id' | 'full_name'>;

const getTeachers = async (): Promise<ApiResponse<Teacher[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/teachers`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error?.message || "Error al obtener la lista de profesores";
    return { data: null, error: { message } };
  }
};

export const UserService = {
  getTeachers,
};