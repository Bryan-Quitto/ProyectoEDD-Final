import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Evaluation } from '@plataforma-educativa/types';
import { evaluationService } from '../../services/evaluationService'; // Asumimos que este servicio se creará
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EvaluationForm, EvaluationFormData } from '../../components/admin/EvaluationForm';
import { ArrowLeft } from 'lucide-react';

const ModuleEvaluationBuilderPage: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [existingEvaluation, setExistingEvaluation] = useState<Partial<Evaluation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadEvaluation = useCallback(async () => {
    if (!moduleId) return;
    setIsLoading(true);
    try {
      const { data, error: apiError } = await evaluationService.getByModuleId(moduleId);
      if (apiError) throw new Error(apiError.message);
      setExistingEvaluation(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("No se pudo cargar la evaluación existente.");
    } finally {
      setIsLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  const handleSave = async (formData: EvaluationFormData) => {
    if (!moduleId) return;
    setIsSaving(true);
    
    const promise = evaluationService.upsertByModuleId(moduleId, formData);

    toast.promise(promise, {
      loading: 'Guardando evaluación...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message);
        setIsSaving(false);
        setExistingEvaluation(res.data);
        return '¡Evaluación guardada con éxito!';
      },
      error: (err) => {
        setIsSaving(false);
        return err.message;
      },
    });
  };

  const handleCancel = () => {
    navigate(`/manage/course/edit/${courseId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="container mx-auto p-8"><Alert variant="destructive">{error}</Alert></div>;
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to={`/manage/course/edit/${courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Editor del Curso
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Constructor de Evaluación del Módulo</CardTitle>
            <CardDescription>
              Crea o edita la evaluación final para este módulo. Esta se presentará al estudiante después de que complete todas las lecciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EvaluationForm
              onSave={handleSave}
              existingEvaluation={existingEvaluation}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModuleEvaluationBuilderPage;