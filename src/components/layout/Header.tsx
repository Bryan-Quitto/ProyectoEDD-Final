import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, User, Settings, LogOut, ChevronDown } from 'lucide-react';

const getInitials = (name: string = ''): string => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = user?.role === 'student'
    ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Cursos', href: '/courses' },
      ]
    : user?.role === 'admin' || user?.role === 'teacher'
    ? [
        { name: 'Dashboard', href: '/admin/dashboard' },
      ]
    : [];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800 tracking-tight">
                EduPlatform
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    classNames(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative ml-3" ref={menuRef}>
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <span className="sr-only">Abrir menú de usuario</span>
                    <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-base">
                      {getInitials(user.full_name)}
                    </div>
                    <ChevronDown
                      className={`ml-2 h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        isMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
                
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-4 w-4 text-gray-500" />
                        <span>Mi Perfil</span>
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>Configuración</span>
                      </Link>
                      <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <LogOut className="h-4 w-4 text-gray-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md">
                    Iniciar Sesión
                 </Link>
                 <Link to="/register" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    Registrarse
                 </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;