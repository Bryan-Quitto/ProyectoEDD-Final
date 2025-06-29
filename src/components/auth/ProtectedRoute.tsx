import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    // Si no hay usuario, redirige a la página de login
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Si el rol del usuario no está permitido, redirige al dashboard de estudiante
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si el usuario y el rol son correctos, renderiza la ruta anidada
  return <Outlet />;
};