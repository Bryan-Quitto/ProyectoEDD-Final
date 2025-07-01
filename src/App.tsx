import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Spinner } from './components/ui/Spinner';
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonViewPage from './pages/LessonViewPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CourseBuilderPage from './pages/admin/CourseBuilderPage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import CourseStudentsPage from './pages/teacher/CourseStudentsPage';
import StudentProgressPage from './pages/teacher/StudentProgressPage';
import AdminStudentListPage from './pages/admin/AdminStudentListPage';
import ModuleEvaluationBuilderPage from './pages/admin/ModuleEvaluationBuilderPage';
import ModuleEvaluationPage from './pages/ModuleEvaluationPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
        <span className='ml-4 text-gray-600'>Verificando sesión...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const getHomeRedirect = () => {
    switch(user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
      default:
        return '/dashboard';
    }
  };

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to={getHomeRedirect()} replace />} />
        <Route path="/login" element={<Navigate to={getHomeRedirect()} replace />} />
        
        {/* Rutas para Estudiantes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/courses" element={<CourseCatalogPage />} />
          <Route path="/course/:courseId" element={<CourseDetailPage />} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<LessonViewPage />} />
          <Route path="/course/:courseId/module/:moduleId/evaluation" element={<ModuleEvaluationPage />} />
        </Route>

        {/* Rutas para Administradores */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/students" element={<AdminStudentListPage />} />
        </Route>
        
        {/* Rutas para Gestión de Cursos (Admin y Teacher) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
          <Route path="/manage/course/create" element={<CourseBuilderPage mode="create" />} />
          <Route path="/manage/course/edit/:courseId" element={<CourseBuilderPage mode="edit" />} />
          <Route path="/manage/course/:courseId/module/:moduleId/evaluation" element={<ModuleEvaluationBuilderPage />} />
        </Route>

        {/* Rutas para Profesores */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
          <Route path="/teacher/course/:courseId/students" element={<CourseStudentsPage />} />
          <Route path="/teacher/course/:courseId/student/:studentId" element={<StudentProgressPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;