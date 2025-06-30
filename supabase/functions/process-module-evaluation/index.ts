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
    console.log(`1. PAYLOAD_OK: Recibido attempt_id: ${attempt_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    console.log('2. SUPABASE_CLIENT_OK');

    const { data: attempt, error: attemptError } = await supabase
      .from('evaluation_attempts')
      .select('*, evaluations(*)')
      .eq('id', attempt_id)
      .single();
    
    if (attemptError) throw new Error(`Error al buscar intento: ${attemptError.message}`);
    if (!attempt) throw new Error(`Intento de evaluación no encontrado: ${attempt_id}`);
    console.log('3. ATTEMPT_FETCH_OK');
    
    const { student_id, percentage } = attempt;
    const evaluation = attempt.evaluations;
    if (!evaluation || !evaluation.module_id) throw new Error("La evaluación no está asociada a un módulo.");
    
    const module_id = evaluation.module_id;
    const evaluationTitle = evaluation.title || "del Módulo";
    console.log('4. EVAL_DATA_OK:', { student_id, percentage, module_id });

    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('course_id')
      .eq('id', module_id)
      .single();

    if (moduleError || !moduleData) throw new Error(`Módulo no encontrado: ${moduleError?.message}`);
    const course_id = moduleData.course_id;
    if (!course_id || !student_id) throw new Error("Faltan datos críticos (course_id, student_id).");
    console.log('5. COURSE_ID_FETCH_OK:', { course_id });

    let performance_level: 'low' | 'average' | 'high';
    if (percentage < 70) performance_level = 'low';
    else if (percentage < 90) performance_level = 'average';
    else performance_level = 'high';
    console.log(`6. PERFORMANCE_CALCULATED: ${performance_level}`);

    if (performance_level === 'high') {
      console.log('7a. HIGH_PERFORMANCE_PATH');
      await supabase.from('recommendations').insert({
        student_id, course_id, recommendation_type: 'praise',
        title: `¡Excelente trabajo en "${evaluationTitle}"!`,
        description: '¡Felicidades! Tuviste un rendimiento sobresaliente.',
        priority: 'medium'
      }).select();
    } else {
      console.log('7b. LOW/AVG_PERFORMANCE_PATH');
      console.log('8a. BUSCANDO RECURSOS DE APOYO PARA:', { module_id, performance_level });

      const { data: resources, error: resourcesError } = await supabase
        .from('module_support_resources')
        .select('*')
        .eq('module_id', module_id)
        .eq('performance_level', performance_level);
      
      if (resourcesError) throw resourcesError;
      console.log('8b. RECURSOS ENCONTRADOS:', JSON.stringify(resources, null, 2));
      
      if (resources && resources.length > 0) {
        const newRecommendations = resources.map(res => ({
          student_id, course_id, recommendation_type: 'support_material',
          title: `Recurso de Apoyo: ${res.title}`,
          description: `Para reforzar el módulo "${evaluationTitle}", te sugerimos este recurso.`,
          priority: 'high', recommended_content_id: res.id,
          recommended_content_type: res.resource_type as 'pdf' | 'url',
          action_url: res.url
        }));
        console.log('9a. DATOS A INSERTAR EN RECOMENDACIONES:', JSON.stringify(newRecommendations, null, 2));
        
        const { data: insertedData, error: insertError } = await supabase
            .from('recommendations')
            .insert(newRecommendations)
            .select();

        if (insertError) {
            console.error('9e. ERROR EN LA INSERCIÓN:', insertError);
            throw insertError;
        }

        console.log('9b. DATOS INSERTADOS EXITOSAMENTE:', JSON.stringify(insertedData, null, 2));

      } else {
        console.log('9c. NO SE ENCONTRARON RECURSOS, NO SE INSERTA NADA.');
      }
    }
    
    return new Response(JSON.stringify({ message: 'Proceso completado.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[FATAL] Error en la función: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});