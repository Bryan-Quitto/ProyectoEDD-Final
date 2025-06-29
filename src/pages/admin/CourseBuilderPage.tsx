import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '../../services/courseService';
import type { CourseFormData } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { ModuleList } from '../../components/admin/ModuleList';

interface CourseBuilderPageProps {
  mode: 'create' | 'edit';
}

const CourseBuilderPage: React.FC<CourseBuilderPageProps> = ({ mode }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
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

  const [formError, setFormError] = useState<string | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && courseId) {
      setLoadingInitialData(true);
      CourseService.getCourseById(courseId).then(response => {
        if (response.data) {
          reset(response.data);
        } else {
          setFormError("No se pudo cargar la información del curso para editar.");
        }
        setLoadingInitialData(false);
      });
    } else {
      setLoadingInitialData(false);
    }
  }, [mode, courseId, reset]);

  const onSubmit: SubmitHandler<CourseFormData> = async (formData) => {
    setFormError(null);
    let response;

    const data = {
      ...formData,
      estimated_duration: Number(formData.estimated_duration) || 0
    };

    if (mode === 'create') {
      const dataToCreate = { ...data, teacher_id: user?.id || null };
      response = await CourseService.createCourse(dataToCreate);
    } else {
      response = await CourseService.updateCourse(courseId!, data);
    }

    if (response.error) {
      setFormError(response.error.message);
    } else {
      alert(`Curso ${mode === 'create' ? 'creado' : 'actualizado'} con éxito!`);
      if(mode === 'create' && response.data) {
        navigate(`/admin/course/edit/${response.data.id}`);
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  if (loadingInitialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-4 text-gray-600">Cargando datos del curso...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {mode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Curso</label>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'El título es obligatorio' }}
              render={({ field }) => <Input id="title" {...field} />}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'La descripción es obligatoria' }}
              render={({ field }) => <textarea id="description" {...field} value={field.value || ''} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">Nivel de Dificultad</label>
            <Controller
              name="difficulty_level"
              control={control}
              rules={{ required: 'Debe seleccionar un nivel' }}
              render={({ field }) => (
                <select {...field} id="difficulty_level" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              )}
            />
            {errors.difficulty_level && <p className="text-red-500 text-xs mt-1">{errors.difficulty_level.message}</p>}
          </div>

          <div>
            <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700">Duración Estimada (en horas)</label>
            <Controller
              name="estimated_duration"
              control={control}
              rules={{ required: 'La duración es obligatoria', min: { value: 1, message: 'Debe ser al menos 1 hora' } }}
              render={({ field }) => <Input id="estimated_duration" type="number" {...field} />}
            />
            {errors.estimated_duration && <p className="text-red-500 text-xs mt-1">{errors.estimated_duration.message}</p>}
          </div>

          {formError && <Alert variant="destructive" title="Error en el formulario">{formError}</Alert>}

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : (mode === 'create' ? 'Crear y Continuar' : 'Guardar Cambios')}
            </Button>
          </div>
        </form>
      </div>

      {mode === 'edit' && courseId && (
        <div className="bg-white p-8 rounded-lg shadow-md">
           <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Módulos</h2>
           <ModuleList courseId={courseId} />
        </div>
      )}
    </div>
  );
};

export default CourseBuilderPage;