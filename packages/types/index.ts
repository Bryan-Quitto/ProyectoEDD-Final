export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  date_of_birth?: string | null;
  national_id?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  teacher_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string;
  instructor_name?: string;
  total_lessons?: number;
  completed_lessons?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  lesson_type: 'video' | 'text' | 'interactive' | 'quiz';
  content_url?: string;
  estimated_duration: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  evaluation?: Partial<Evaluation>;
  is_completed_by_user?: boolean;
}

export interface Enrollment {
  id: number;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  status: 'in_progress' | 'completed' | 'dropped';
}

export interface Question {
  id: string;
  evaluation_id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_option?: number;
  correct_options?: number[];
  points: number;
}

export interface Evaluation {
  id:string;
  lesson_id: string | null;
  module_id: string | null;
  title: string;
  description: string | null;
  evaluation_type: 'quiz' | 'assignment' | 'project';
  questions: Question[];
  max_score: number;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationAttempt {
  id: string;
  evaluation_id: string;
  student_id: string;
  attempt_number: number;
  answers: Record<string, unknown>;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_minutes?: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface EvaluationContext {
  studentId: string;
  courseId: string;
  attempt: EvaluationAttempt;
  evaluation: Evaluation;
  allAttempts: EvaluationAttempt[];
}

export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent: number;
  last_accessed: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceState {
  id: string;
  student_id: string;
  course_id: string;
  overall_progress: number;
  average_score: number;
  total_time_spent: number;
  lessons_completed: number;
  evaluations_passed: number;
  current_difficulty: 'beginner' | 'intermediate' | 'advanced';
  learning_pace: 'slow' | 'normal' | 'fast';
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleSupportResource {
  id: string;
  module_id: string;
  performance_level: 'low' | 'average';
  resource_type: 'pdf' | 'url';
  title: string;
  url: string;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentStats {
  coursesInProgress: number;
  lessonsCompleted: number;
  averageScore: number | null;
}

export interface CreateUserData {
  email: string;
  password?: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  date_of_birth?: string | null;
  national_id?: string | null;
  phone_number?: string | null;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Recommendation {
  id: string;
  student_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  recommended_content_id?: string;
  recommended_content_type?: 'lesson' | 'course' | 'evaluation';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_applied: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  reason?: string;
  course_id?: string;
  lesson_id?: string;
}

export interface CourseDetails extends Course {
  modules: Module[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface CourseFilters {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RecommendationAction {
  type: 'content' | 'difficulty' | 'pace' | 'review' | 'remedial' | 'support' | 'advance';
  target: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  title: string;
}

export interface DecisionNode {
  id: string;
  condition?: string;
  threshold?: number;
  trueNode?: DecisionNode;
  falseNode?: DecisionNode;
  action?: RecommendationAction;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: ApiError | null }>;
  signUp: (userData: CreateUserData) => Promise<{ error: ApiError | null }>;
  signOut: () => Promise<void>;
}