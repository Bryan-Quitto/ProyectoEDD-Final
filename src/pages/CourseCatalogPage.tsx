import React from 'react';
import {CourseList} from '../components/course/CourseList';

const CourseCatalogPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Explora Nuestros Cursos
      </h1>
      <CourseList />
    </div>
  );
};

export default CourseCatalogPage;