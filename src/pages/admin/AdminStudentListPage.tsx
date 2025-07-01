import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserService } from '../../services/userService';
import type { User } from '@plataforma-educativa/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const AdminStudentListPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const response = await UserService.getAllStudents(searchTerm);
      if (response.data) {
        setStudents(response.data.data);
      } else {
        setError(response.error?.message || 'Error al cargar estudiantes');
      }
      setLoading(false);
    };

    const timerId = setTimeout(() => {
      fetchStudents();
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/dashboard" className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Todos los Estudiantes</h1>
          <p className="text-gray-600">Busca y gestiona todos los estudiantes de la plataforma.</p>
        </div>
      </div>
      
      <div className="mb-6">
        <Input 
          type="text"
          placeholder="Buscar estudiante por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading && <div className="text-center p-10"><Spinner size="lg" /></div>}
      {error && <Alert variant="destructive" title="Error">{error}</Alert>}
      
      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(student.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">No se encontraron estudiantes con esos criterios.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentListPage;