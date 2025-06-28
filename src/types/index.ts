// Tipos de Usuario
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  updated_at: string;
}

// Tipos de Curso
export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // en minutos
  teacher_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Módulo
export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Lección
export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  lesson_type: 'video' | 'text' | 'interactive' | 'quiz';
  order_index: number;
  estimated_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Evaluación
export interface Evaluation {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  evaluation_type: 'quiz' | 'assignment' | 'project';
  questions: Question[];
  max_score: number;
  passing_score: number;
  time_limit?: number; // en minutos
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[]; // para multiple choice
  correct_answer: string | string[];
  points: number;
  explanation?: string;
}

// Tipos de Intento de Evaluación
export interface EvaluationAttempt {
  id: string;
  evaluation_id: string;
  student_id: string;
  answers: Record<string, any>;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken?: number; // en minutos
  started_at: string;
  completed_at?: string;
  created_at: string;
}

// Tipos de Progreso del Estudiante
export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent: number; // en minutos
  last_accessed: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de Estado de Rendimiento
export interface PerformanceState {
  id: string;
  student_id: string;
  course_id: string;
  overall_progress: number; // 0-100
  average_score: number; // 0-100
  total_time_spent: number; // en minutos
  lessons_completed: number;
  evaluations_passed: number;
  current_difficulty: 'beginner' | 'intermediate' | 'advanced';
  learning_pace: 'slow' | 'normal' | 'fast';
  last_activity: string;
  created_at: string;
  updated_at: string;
}

// Tipos de Recomendación
export interface Recommendation {
  id: string;
  student_id: string;
  recommendation_type: 'content' | 'study_plan' | 'difficulty_adjustment';
  title: string;
  description: string;
  recommended_content_id?: string;
  recommended_content_type?: 'lesson' | 'course' | 'evaluation';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_applied: boolean;
  created_at: string;
  expires_at?: string;
}

// Tipos para Respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para el Árbol de Decisión
export interface DecisionNode {
  id: string;
  condition: string;
  threshold?: number;
  trueNode?: DecisionNode;
  falseNode?: DecisionNode;
  action?: RecommendationAction;
}

export interface RecommendationAction {
  type: 'content' | 'difficulty' | 'pace' | 'review';
  target: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
}

// Tipos para Filtros y Búsquedas
export interface CourseFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  teacher_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface StudentFilters {
  course_id?: string;
  progress_min?: number;
  progress_max?: number;
  last_activity_after?: string;
}