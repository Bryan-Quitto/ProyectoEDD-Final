import React, { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { ModuleSupportResource } from '@plataforma-educativa/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, FileText, Link2, UploadCloud } from 'lucide-react';
import { moduleSupportResourceService } from '../../services/moduleSupportResourceService';

type FormData = {
  title: string;
  url: string;
  file?: FileList;
};

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceAdded: (resource: ModuleSupportResource) => void;
  moduleId: string;
  performanceLevel: 'low' | 'average';
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onResourceAdded, moduleId, performanceLevel }) => {
  const { control, handleSubmit, register, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [resourceType, setResourceType] = useState<'url' | 'pdf'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file = watch('file');
  const fileName = file && file.length > 0 ? file[0].name : '';

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    let resourceUrl = formData.url;

    if (resourceType === 'pdf') {
      if (!formData.file || formData.file.length === 0) {
        toast.error("Por favor, selecciona un archivo PDF.");
        return;
      }
      const fileToUpload = formData.file[0];
      const uploadPromise = moduleSupportResourceService.uploadPdf(fileToUpload);
      
      const uploadResult = await toast.promise(uploadPromise, {
        loading: 'Subiendo PDF...',
        success: 'PDF subido con éxito!',
        error: 'Error al subir el PDF.',
      });

      if (uploadResult.error || !uploadResult.data) {
        return;
      }
      resourceUrl = uploadResult.data.path;
    }

    const resourceData = {
      module_id: moduleId,
      performance_level: performanceLevel,
      resource_type: resourceType,
      title: formData.title,
      url: resourceUrl,
      teacher_id: null, // El backend podría asociarlo al usuario autenticado si es necesario
    };
    
    const creationResult = await moduleSupportResourceService.create(resourceData);

    if (creationResult.data) {
      toast.success("Recurso añadido con éxito.");
      onResourceAdded(creationResult.data);
      handleClose();
    } else {
      toast.error(creationResult.error?.message || "No se pudo añadir el recurso.");
    }
  };
  
  const handleClose = () => {
    reset();
    setResourceType('url');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-30" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-95" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>Añadir Nuevo Recurso de Apoyo</span>
                  <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100"><X className="h-4 w-4" /></button>
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Recurso</label>
                    <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                      <button type="button" onClick={() => setResourceType('url')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${resourceType === 'url' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}> <Link2 className="inline-block mr-1 h-4 w-4"/> URL</button>
                      <button type="button" onClick={() => setResourceType('pdf')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${resourceType === 'pdf' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}> <FileText className="inline-block mr-1 h-4 w-4"/> PDF</button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Recurso</label>
                    <Controller name="title" control={control} rules={{ required: 'El título es obligatorio' }} render={({ field }) => <Input id="title" {...field} />} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>

                  {resourceType === 'url' ? (
                    <div>
                      <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
                      <Controller name="url" control={control} rules={{ required: 'La URL es obligatoria', pattern: { value: /^(https?:\/\/).+/, message: 'Debe ser una URL válida.' } }} render={({ field }) => <Input id="url" {...field} placeholder="https://ejemplo.com/recurso" />} />
                      {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Archivo PDF</label>
                       <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Selecciona un archivo</span>
                              <input id="file-upload" type="file" className="sr-only" {...register('file', { required: resourceType === 'pdf' })} accept=".pdf" />
                            </label>
                            <p className="pl-1">o arrástralo aquí</p>
                          </div>
                          {fileName && <p className="text-xs text-gray-500 mt-2">{fileName}</p>}
                          <p className="text-xs text-gray-500">PDF hasta 10MB</p>
                        </div>
                      </div>
                      {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>}
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" isLoading={isSubmitting}>Añadir Recurso</Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};