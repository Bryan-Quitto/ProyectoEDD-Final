import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            duration: 3000,
            style: {
              background: '#28a745',
              color: 'white',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#dc3545',
              color: 'white',
            },
          },
        }}
      />
    </div>
  );
};

export default MainLayout;