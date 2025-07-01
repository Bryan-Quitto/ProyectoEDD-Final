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
    
    const evaluation = attempt.evaluations;
    if (!evaluation) throw new Error('El intento no tiene una evaluación asociada.');
    if (!evaluation.module_id) throw new Error('La evaluación no está asociada a un módulo.');
    if (!evaluation.modules) throw new Error('La evaluación no tiene un módulo relacionado o no se pudo cargar.');

    const isDiagnostic = evaluation.evaluation_type === 'diagnostic';

    // --- NUEVA LÓGICA PARA LA EVALUACIÓN DE DIAGNÓSTICO ---
    if (isDiagnostic) {
      console.log('Procesando evaluación de diagnóstico...');
      
      let diagnostic_level: 'low' | 'average' | 'high' = 'low';
      if (attempt.percentage >= 90) {
        diagnostic_level = 'high';
      } else if (attempt.percentage >= 70) {
        diagnostic_level = 'average';
      }
      // Si es < 70, ya es 'low' por defecto.

      console.log(`Puntaje: ${attempt.percentage}%. Nivel de diagnóstico asignado: ${diagnostic_level}`);

      const { error: progressError } = await supabase
        .from('module_progress')
        .upsert({
          student_id: attempt.student_id,
          module_id: evaluation.module_id,
          diagnostic_level: diagnostic_level,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id, module_id' // Asegura que se actualice si ya existe
        });

      if (progressError) {
        throw new Error(`Error al guardar el nivel de diagnóstico: ${progressError.message}`);
      }
      
      console.log('Nivel de diagnóstico guardado exitosamente en module_progress.');
    }
    // La lógica anterior para buscar recursos de soporte aquí se ha eliminado
    // porque ahora la maneja el RecommendationService del backend.

    // --- LÓGICA DE WEBHOOK AL BACKEND (se mantiene igual) ---
    const course_id = evaluation.modules.course_id;

    const { data: allAttempts, error: allAttemptsError } = await supabase
      .from('evaluation_attempts')
      .select('*')
      .eq('evaluation_id', attempt.evaluation_id)
      .eq('student_id', attempt.student_id);

    if (allAttemptsError) throw allAttemptsError;

    const contextPayload = {
        studentId: attempt.student_id,
        courseId: course_id,
        evaluation: evaluation,
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

    return new Response(JSON.stringify({ message: 'Proceso de evaluación y recomendación completado.' }), {
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