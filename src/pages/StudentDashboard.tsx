import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BookOpen, CheckCircle, BarChart2 } from 'lucide-react';
import { CourseList } from '../components/course/CourseList';
import { RecommendationPanel } from '../components/recommendation/RecommendationPanel';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Cursos en Progreso', stat: '2', icon: BookOpen },
    { name: 'Lecciones Completadas', stat: '17', icon: CheckCircle },
    { name: 'Puntaje Promedio', stat: '85%', icon: BarChart2 },
  ];

  // Si el usuario aún no ha cargado, podemos mostrar un esqueleto o un mensaje.
  if (!user) {
    return <div>Cargando información del usuario...</div>;
  }

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
          {/* No pasamos props, el componente es autónomo */}
          <CourseList />
        </div>
        <div>
          {/* Pasamos solo la prop que necesita: studentId */}
          <RecommendationPanel studentId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;