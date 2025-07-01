import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { resourceService, CourseResource } from '../../services/resourceService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { FileUp, Trash2, Link as LinkIcon, File as FileIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface CourseResourcesManagerProps {
  courseId: string;
}

type FormData = {
  title: string;
  description: string;
  file: FileList;
};

export const CourseResourcesManager: React.FC<CourseResourcesManagerProps> = ({ courseId }) => {
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, register, reset, formState: { isSubmitting } } = useForm<FormData>();

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    const res = await resourceService.getResourcesByCourse(courseId);
    if (res.data) {
      setResources(res.data);
    } else {
      setError(res.error?.message || 'Error cargando recursos.');
    }
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const onSubmit = async (formData: FormData) => {
    if (!formData.file || formData.file.length === 0) {
      toast.error('Por favor, selecciona un archivo para subir.');
      return;
    }
    const file = formData.file[0];
    const promise = resourceService.uploadResourceFile(courseId, file)
      .then(publicUrl => {
        return resourceService.createResourceEntry({
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          url: publicUrl,
          resource_type: 'pdf', // Asumimos PDF por ahora
        });
      });

    toast.promise(promise, {
      loading: 'Subiendo y guardando recurso...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        fetchResources();
        reset({ title: '', description: '', file: undefined });
        return 'Recurso añadido con éxito.';
      },
      error: (err) => err.message,
    });
  };

  const handleDelete = (resourceId: string, resourceUrl: string) => {
    toast((t) => (
      <div className='flex flex-col gap-2'>
        <p>¿Seguro que quieres eliminar este recurso?</p>
        <div className='flex gap-2'>
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const deletePromise = resourceService.deleteResource(resourceId, resourceUrl);
            toast.promise(deletePromise, {
              loading: 'Eliminando...',
              success: () => {
                fetchResources();
                return 'Recurso eliminado.';
              },
              error: 'No se pudo eliminar el recurso.'
            });
          }}>
            Sí, eliminar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Recursos Generales del Curso</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-gray-50 border rounded-lg space-y-4">
        <h4 className="font-semibold">Añadir Nuevo Recurso (PDF)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller name="title" control={control} rules={{ required: true }} render={({ field }) => <Input {...field} placeholder="Título del recurso" />} />
          <Controller name="description" control={control} render={({ field }) => <Input {...field} placeholder="Descripción (opcional)" />} />
        </div>
        <div>
          <label htmlFor="file-upload" className="sr-only">Elegir archivo</label>
          <input id="file-upload" type="file" {...register('file', { required: true })} accept=".pdf" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}><FileUp className="h-4 w-4 mr-2" /> Subir y Guardar</Button>
        </div>
      </form>
      
      <div>
        <h4 className="font-semibold mb-2">Recursos Existentes</h4>
        {isLoading ? <Spinner /> : error ? <Alert variant="destructive">{error}</Alert> : null}
        
        {resources.length > 0 ? (
          <ul className="space-y-2">
            {resources.map(res => (
              <li key={res.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                  <FileIcon className="h-5 w-5" />
                  <span className="font-medium">{res.title}</span>
                </a>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id, res.url)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <p className="text-sm text-gray-500">No hay recursos para este curso.</p>
        )}
      </div>
    </div>
  );
};