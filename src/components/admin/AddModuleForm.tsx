import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { moduleService, CreateModuleData } from '../../services/moduleService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';

interface AddModuleFormProps {
  courseId: string;
  onModuleAdded: () => void;
  onCancel: () => void;
  nextOrderIndex: number;
}

type FormData = {
  title: string;
  description: string;
};

export const AddModuleForm: React.FC<AddModuleFormProps> = ({ courseId, onModuleAdded, onCancel, nextOrderIndex }) => {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { title: '', description: '' },
  });

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    setFormError(null);
    const moduleData: CreateModuleData = {
      ...formData,
      course_id: courseId,
      order_index: nextOrderIndex,
      is_active: true,
    };

    const response = await moduleService.createModule(moduleData);
    if (response.data) {
      onModuleAdded();
    } else {
      setFormError(response.error?.message || 'Error al crear el módulo.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Nuevo Módulo</h3>
      <div>
        <label htmlFor="module-title" className="block text-sm font-medium text-gray-700">Título del Módulo</label>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'El título es obligatorio' }}
          render={({ field }) => <Input id="module-title" {...field} />}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="module-description" className="block text-sm font-medium text-gray-700">Descripción</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <textarea id="module-description" {...field} value={field.value || ''} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />}
        />
      </div>

      {formError && <Alert variant="destructive">{formError}</Alert>}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" /> : 'Añadir Módulo'}
        </Button>
      </div>
    </form>
  );
};