import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BookOpen, CheckCircle, BarChart2 } from 'lucide-react';
import { CourseCard } from '../components/course/CourseCard';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { CourseService } from '../services/courseService';
import type { Course } from '@plataforma-educativa/types';
import { RecommendationPanel } from '../components/recommendation/RecommendationPanel';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      setError(null);
      CourseService.getEnrolledCourses(user.id)
        .then(response => {
          if (response.data) {
            setEnrolledCourses(response.data);
          } else {
            setError(response.error?.message || 'No se pudieron cargar tus cursos.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const stats = [
    { name: 'Cursos en Progreso', stat: loading ? '...' : enrolledCourses.length, icon: BookOpen },
    { name: 'Lecciones Completadas', stat: '17', icon: CheckCircle },
    { name: 'Puntaje Promedio', stat: '85%', icon: BarChart2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">¡Hola de nuevo, {user.full_name}!</h1>
        <p className="mt-2 text-lg text-gray-600">Continuemos construyendo tu futuro. Aquí tienes un resumen de tu progreso.</p>
      </div>

      <div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <Card key={item.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{item.name}</CardTitle>
                <item.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.stat}</div>
              </CardContent>
            </Card>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tus Cursos</h2>
          {loading ? (
            <div className="text-center p-10"><Spinner size="lg" /></div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
              Aún no estás inscrito en ningún curso. ¡Explora el catálogo para empezar!
            </p>
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