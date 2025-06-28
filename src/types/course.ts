export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  // El progreso es opcional, ya que no todos los cursos del catálogo
  // estarán en progreso por el usuario.
  progress?: number; 
}