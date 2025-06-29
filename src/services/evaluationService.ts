import type { ApiResponse, EvaluationAttempt } from '@plataforma-educativa/types';
import axios from 'axios';

const API_BASE_URL = '/api';

type StudentAnswers = Record<string, number>;

const submitAttempt = async (evaluationId: string, studentId: string, answers: StudentAnswers): Promise<ApiResponse<EvaluationAttempt>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/evaluations/${evaluationId}/submit`, {
      student_id: studentId,
      answers,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error?.message || "Error al enviar la evaluación";
    return { data: null, error: { message } };
  }
};

export const evaluationService = {
  submitAttempt,
};