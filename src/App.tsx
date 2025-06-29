import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Spinner } from './components/ui/Spinner';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Componentes de Autenticación
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonViewPage from './pages/LessonViewPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CourseBuilderPage from './pages/admin/CourseBuilderPage';

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

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      
      <Route
        path="/*"
        element={
          user ? (
            <MainLayout>
              <Routes>
                {/* --- RUTAS PARA TODOS LOS USUARIOS LOGUEADOS --- */}
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/courses" element={<CourseCatalogPage />} />
                <Route path="/course/:courseId" element={<CourseDetailPage />} />
                <Route path="/course/:courseId/lesson/:lessonId" element={<LessonViewPage />} />

                {/* --- RUTAS PROTEGIDAS PARA ADMIN/TEACHER --- */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/course/create" element={<CourseBuilderPage mode="create" />} />
                  <Route path="/admin/course/edit/:courseId" element={<CourseBuilderPage mode="edit" />} />
                </Route>

                {/* --- REDIRECCIÓN PRINCIPAL --- */}
                <Route 
                  path="/" 
                  element={
                    user.role === 'admin' || user.role === 'teacher' 
                      ? <Navigate to="/admin/dashboard" replace /> 
                      : <Navigate to="/dashboard" replace />
                  } 
                />
                
                {/* Ruta para cualquier otra URL no encontrada */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;