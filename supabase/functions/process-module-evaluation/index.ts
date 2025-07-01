import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ModuleEvaluationPayload {
  attempt_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ModuleEvaluationPayload = await req.json();
    const { attempt_id } = payload;
    if (!attempt_id) throw new Error("Falta attempt_id en el payload.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: attempt, error: attemptError } = await supabase
      .from('evaluation_attempts')
      .select('*, evaluations(*, modules(course_id))')
      .eq('id', attempt_id)
      .single();
    
    if (attemptError) throw new Error(`Error al buscar intento: ${attemptError.message}`);
    if (!attempt) throw new Error(`Intento de evaluación no encontrado: ${attempt_id}`);
    if (!attempt.evaluations) throw new Error('El intento no tiene una evaluación asociada.');
    if (!attempt.evaluations.module_id) throw new Error('La evaluación no está asociada a un módulo.');
    if (!attempt.evaluations.modules) throw new Error('La evaluación no tiene un módulo relacionado o no se pudo cargar.');

    const isDiagnostic = attempt.evaluations.evaluation_type === 'diagnostic';
    const course_id = attempt.evaluations.modules.course_id;

    if (!isDiagnostic && attempt.percentage < 90) {
        const performance_level = attempt.percentage < 70 ? 'low' : 'average';
        const { data: resources } = await supabase
            .from('module_support_resources')
            .select('*')
            .eq('module_id', attempt.evaluations.module_id)
            .eq('performance_level', performance_level);

        if (resources && resources.length > 0) {
            const supportRecommendations = resources.map(res => ({
                student_id: attempt.student_id,
                course_id: course_id,
                recommendation_type: 'support_material',
                title: `Recurso de Apoyo: ${res.title}`,
                description: `Para reforzar el módulo, te sugerimos este recurso: ${res.title}.`,
                priority: 'high',
                recommended_content_id: res.id,
                recommended_content_type: res.resource_type,
                action_url: res.url,
            }));
            await supabase.from('recommendations').insert(supportRecommendations);
        }
    }

    const { data: allAttempts, error: allAttemptsError } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('evaluation_id', attempt.evaluation_id)
        .eq('student_id', attempt.student_id);

    if (allAttemptsError) throw allAttemptsError;

    const contextPayload = {
        studentId: attempt.student_id,
        courseId: course_id,
        evaluation: attempt.evaluations,
        attempt: attempt,
        allAttempts: allAttempts || [],
    };
    
    const backendWebhookUrl = Deno.env.get('BACKEND_WEBHOOK_URL'); 
    const backendApiKey = Deno.env.get('BACKEND_API_KEY');

    if (!backendWebhookUrl || !backendApiKey) {
      throw new Error('El webhook del backend no está configurado en las variables de entorno.');
    }

    const fetchResponse = await fetch(backendWebhookUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-internal-api-key': backendApiKey,
         },
        body: JSON.stringify(contextPayload),
    });

    if (!fetchResponse.ok) {
        const errorBody = await fetchResponse.text();
        throw new Error(`El webhook del backend falló con estado ${fetchResponse.status}: ${errorBody}`);
    }

    return new Response(JSON.stringify({ message: 'Proceso de recomendación iniciado.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[FATAL] Error en la función: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});