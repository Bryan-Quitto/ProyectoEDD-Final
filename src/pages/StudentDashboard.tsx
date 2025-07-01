import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BookOpen, CheckCircle, BarChart2 } from 'lucide-react';
import { CourseCard } from '../components/course/CourseCard';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { CourseService } from '../services/courseService';
import { performanceService } from '../services/performanceService';
import type { Course, StudentStats } from '@plataforma-educativa/types';
import { RecommendationPanel } from '../components/recommendation/RecommendationPanel';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setLoadingCourses(true);
      setLoadingStats(true);
      setError(null);

      const fetchCourses = CourseService.getEnrolledCourses(user.id);
      const fetchStats = performanceService.getStudentStats(user.id);

      Promise.all([fetchCourses, fetchStats])
        .then(([coursesResponse, statsResponse]) => {
          if (coursesResponse.data) {
            setEnrolledCourses(coursesResponse.data);
          } else {
            setError(coursesResponse.error?.message || 'No se pudieron cargar tus cursos.');
          }

          if (statsResponse.data) {
            setStats(statsResponse.data);
          } else {
            setError(prev => prev ? `${prev} y ${statsResponse.error?.message}` : statsResponse.error?.message || 'No se pudieron cargar las estadísticas.');
          }
        })
        .catch(err => {
            const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado al cargar los datos.';
            setError(message);
        })
        .finally(() => {
          setLoadingCourses(false);
          setLoadingStats(false);
        });
    }
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const statCards = [
    { name: 'Cursos en Progreso', value: loadingStats ? '...' : stats?.coursesInProgress ?? 0, icon: BookOpen },
    { name: 'Lecciones Completadas', value: loadingStats ? '...' : stats?.lessonsCompleted ?? 0, icon: CheckCircle },
    { name: 'Puntaje Promedio', value: loadingStats ? '...' : (stats?.averageScore !== null ? `${stats?.averageScore}%` : 'N/A'), icon: BarChart2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">¡Hola de nuevo, {user.full_name}!</h1>
        <p className="mt-2 text-lg text-gray-600">Continuemos construyendo tu futuro. Aquí tienes un resumen de tu progreso.</p>
      </div>

      <div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((item) => (
            <Card key={item.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{item.name}</CardTitle>
                <item.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tus Cursos</h2>
          {loadingCourses ? (
            <div className="text-center p-10"><Spinner size="lg" /></div>
          ) : error && !enrolledCourses.length ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map(course => (
                // --- SECCIÓN MODIFICADA ---
                <Link key={course.id} to={`/course/${course.id}`} className="block">
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center bg-gray-50 p-8 rounded-lg border-2 border-dashed flex flex-col items-center gap-4">
              <p className="text-gray-600 font-medium">Aún no estás inscrito en ningún curso.</p>
              <Button asChild>
                <Link to="/courses">Explorar Catálogo de Cursos</Link>
              </Button>
            </div>
          )}
        </div>
        <div>
          <RecommendationPanel studentId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;