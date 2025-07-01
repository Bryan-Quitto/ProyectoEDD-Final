import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '../../services/courseService';
import { UserService } from '../../services/userService';
import type { CourseFormData } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ModuleList } from '../../components/admin/ModuleList';
import { CourseResourcesManager } from '../../components/admin/CourseResourcesManager';
import toast from 'react-hot-toast';

type Teacher = { id: string; full_name: string };

interface CourseBuilderPageProps {
  mode: 'create' | 'edit';
}

const CourseBuilderPage: React.FC<CourseBuilderPageProps> = ({ mode }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<CourseFormData>({
    defaultValues: {
      title: '',
      description: '',
      difficulty_level: 'beginner',
      estimated_duration: 0,
      is_active: true,
      teacher_id: null,
      image_url: ''
    }
  });

  const [loadingInitialData, setLoadingInitialData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingInitialData(true);
      try {
        let courseData = null;
        
        if (mode === 'edit' && courseId) {
          const courseResponse = await CourseService.getCourseById(courseId);
          if (courseResponse.data) {
            courseData = courseResponse.data;
          } else {
            throw new Error(courseResponse.error?.message || "No se pudo cargar el curso.");
          }
        }
        
        if (user?.role === 'admin') {
          const teachersResponse = await UserService.getTeachers();
          if (teachersResponse.data) {
            setTeachers(teachersResponse.data);
          }
        }

        if (courseData) {
          reset(courseData);
        } else if (mode === 'create' && user?.role === 'teacher') {
          setValue('teacher_id', user.id);
        }

      } catch (err: any) {
        toast.error(err.message || "Ocurrió un error al cargar los datos.");
      } finally {
        setLoadingInitialData(false);
      }
    };
    
    loadData();
  }, [mode, courseId, user, reset, setValue]);

  const onSubmit: SubmitHandler<CourseFormData> = async (formData) => {
    const dataToSubmit = {
      ...formData,
      estimated_duration: Number(formData.estimated_duration) || 0,
      image_url: formData.image_url || undefined,
      teacher_id: formData.teacher_id || null,
    };

    if (mode === 'create' && user?.role === 'teacher') {
      dataToSubmit.teacher_id = user.id;
    }

    const promise = mode === 'create'
      ? CourseService.createCourse(dataToSubmit)
      : CourseService.updateCourse(courseId!, dataToSubmit);

    toast.promise(promise, {
        loading: `${mode === 'create' ? 'Creando' : 'Actualizando'} curso...`,
        success: (res) => {
            if (res.error) throw new Error(res.error.message);
            if (mode === 'create' && res.data) {
                navigate(`/admin/course/edit/${res.data.id}`);
            } else {
                toast.success(`Curso ${mode === 'create' ? 'creado' : 'actualizado'} con éxito!`);
                if (mode === 'edit') {
                    navigate(user?.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard');
                }
            }
            return `Curso ${mode === 'create' ? 'creado' : 'actualizado'}! Redirigiendo...`;
        },
        error: (err) => err.message || 'Ocurrió un error inesperado.',
    });
  };
  
  if (loadingInitialData) {
    return <div className="flex items-center justify-center h-full"><Spinner size="lg" /><span className="ml-4">Cargando datos...</span></div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {mode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Curso</label>
            <Controller name="title" control={control} rules={{ required: 'El título es obligatorio', minLength: { value: 5, message: 'Mínimo 5 caracteres.' } }} render={({ field }) => <Input id="title" {...field} />} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
            <Controller name="description" control={control} rules={{ required: 'La descripción es obligatoria', minLength: { value: 10, message: 'Mínimo 10 caracteres.' } }} render={({ field }) => <textarea id="description" {...field} value={field.value || ''} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">URL de la Imagen (Opcional)</label>
            <Controller name="image_url" control={control} rules={{ pattern: { value: /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))(?:\?.*)?$/, message: "Debe ser una URL de imagen válida." } }} render={({ field }) => <Input id="image_url" {...field} value={field.value || ''} placeholder="https://ejemplo.com/imagen.png" />} />
            {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url.message}</p>}
          </div>
          
          {user?.role === 'admin' && (
            <div>
              <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700">Profesor Asignado</label>
              <Controller name="teacher_id" control={control} render={({ field }) => (
                <select {...field} value={field.value || ''} id="teacher_id" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="" disabled>Selecciona un profesor</option>
                  {teachers.map(teacher => (<option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>))}
                </select>
              )} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">Nivel de Dificultad</label>
              <Controller name="difficulty_level" control={control} rules={{required: 'Debe seleccionar un nivel'}} render={({ field }) => (
                  <select {...field} id="difficulty_level" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
              )} />
              {errors.difficulty_level && <p className="text-red-500 text-xs mt-1">{errors.difficulty_level.message}</p>}
            </div>
            <div>
              <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700">Duración Estimada (en horas)</label>
              <Controller name="estimated_duration" control={control} rules={{ required: 'La duración es obligatoria', min: { value: 1, message: 'Debe ser al menos 1 hora' } }} render={({ field }) => <Input id="estimated_duration" type="number" {...field} />} />
              {errors.estimated_duration && <p className="text-red-500 text-xs mt-1">{errors.estimated_duration.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard')}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Crear y Continuar' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>

      {mode === 'edit' && courseId && (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <ModuleList courseId={courseId} />
        </div>
      )}

      {mode === 'edit' && courseId && (
        <div className="bg-white p-8 rounded-lg shadow-md mt-8">
          <CourseResourcesManager courseId={courseId} />
        </div>
      )}
    </div>
  );
};
  
export default CourseBuilderPage;