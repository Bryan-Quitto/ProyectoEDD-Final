import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} EduPlatform. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Términos de Servicio
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Política de Privacidad
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;